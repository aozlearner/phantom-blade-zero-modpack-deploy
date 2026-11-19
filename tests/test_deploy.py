import hashlib
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile

from pbzpack import core


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.base = Path(self.tmp.name)
        self.game = self.base / "steamapps/common/PBZ"
        (self.game / "platform/steam").mkdir(parents=True)
        (self.game / "platform/steam/PBZ.exe").write_bytes(b"test executable placeholder")
        (self.game / "ProjectPBZ/Content/Paks").mkdir(parents=True)
        (self.base / "steamapps/appmanifest_4115450.acf").write_text('"buildid" "26367565"')
        self.state = self.base / "private-state"
        self.userdata = self.base / "userdata"
        (self.userdata / "123/4115450/remote").mkdir(parents=True)
        (self.userdata / "123/4115450/remote/cloud.sav").write_bytes(b"cloud progress")
        self.save = self.game / "ProjectPBZ/Saved/SaveGames/progress.sav"
        self.save.parent.mkdir(parents=True)
        self.save.write_bytes(b"current progress")
        self.env = patch.dict(os.environ, {"LOCALAPPDATA": str(self.base / "local")})
        self.env.start()
        self.names = ["ProjectPBZ/PBZModLoader/mods/example/main.js", "ProjectPBZ/Content/Paks/~mods/example/test.pak"]
        self.profile, self.bundle = self.make_pack([b"script v1", b"asset v1"], "v1")

    def tearDown(self):
        self.env.stop()
        self.tmp.cleanup()

    def make_pack(self, contents, label):
        p = {"schema": 1, "id": label, "steam_build": "26367565", "files": [
            {"path": n, "size": len(b), "sha256": hashlib.sha256(b).hexdigest()}
            for n, b in zip(self.names, contents)]}
        path = self.base / (label + ".json")
        core.write_json(path, p)
        p = core.load_profile(path)
        bundle = self.base / (label + ".zip")
        with zipfile.ZipFile(bundle, "w") as z:
            for n, b in zip(self.names, contents):
                z.writestr(n, b)
        return p, bundle

    def install(self, profile=None, bundle=None):
        return core.install(self.game, profile or self.profile, bundle or self.bundle, self.state,
                            self.userdata, guard=lambda: None)

    def rollback(self, tx):
        return core.rollback(self.game, self.state, tx, guard=lambda: None)

    def test_fresh_install_backup_and_rollback_never_restore_saves(self):
        result = self.install()
        self.assertEqual(core.verify(self.game, self.profile)["matched"], 2)
        self.assertEqual(result["saves_backed_up"], 2)
        self.save.write_bytes(b"newer progress")
        self.rollback(result["transaction"])
        self.assertFalse((self.game / self.names[0]).exists())
        self.assertEqual(self.save.read_bytes(), b"newer progress")

    def test_identical_existing_files_preserved_on_rollback(self):
        self.install()
        r = self.install()
        self.rollback(r["transaction"])
        self.assertEqual(core.verify(self.game, self.profile)["matched"], 2)

    def test_upgrade_and_restore_prior_version(self):
        first = self.install()
        p, b = self.make_pack([b"script v2"], "v2")
        second = self.install(p, b)
        self.assertFalse((self.game / self.names[1]).exists())
        with self.assertRaises(core.PackError):
            self.rollback(first["transaction"])
        self.rollback(second["transaction"])
        self.assertEqual(core.verify(self.game, self.profile)["matched"], 2)

    def test_unknown_mod_conflict_no_writes(self):
        f = self.game / "ProjectPBZ/Content/Paks/~mods/foreign/mod.pak"
        f.parent.mkdir(parents=True)
        f.write_bytes(b"other user's mod")
        with self.assertRaises(core.PackError):
            self.install()
        self.assertFalse((self.game / self.names[0]).exists())
        self.assertEqual(f.read_bytes(), b"other user's mod")

    def test_existing_different_file_not_overwritten(self):
        f = self.game / self.names[0]
        f.parent.mkdir(parents=True)
        f.write_bytes(b"unowned configuration")
        with self.assertRaises(core.PackError):
            self.install()
        self.assertEqual(f.read_bytes(), b"unowned configuration")

    def test_user_edits_block_upgrade_and_rollback(self):
        r = self.install()
        (self.game / self.names[0]).write_bytes(b"user customization")
        with self.assertRaises(core.PackError):
            self.install()
        with self.assertRaises(core.PackError):
            self.rollback(r["transaction"])

    def test_partial_failure_can_be_recovered(self):
        original = core.atomic_copy
        calls = []
        def fail_second(src, dst):
            calls.append(dst)
            if len(calls) == 2:
                raise OSError("simulated disk failure")
            original(src, dst)
        with patch.object(core, "atomic_copy", fail_second), self.assertRaises(OSError):
            self.install()
        tx = next((self.state / "transactions").iterdir())
        self.assertEqual(core.read_json(tx / "receipt.json")["status"], "failed")
        with self.assertRaises(core.PackError):
            self.install()
        self.rollback("transactions/" + tx.name)
        self.assertFalse((self.game / self.names[0]).exists())

    def test_damaged_backup_blocks_entire_rollback(self):
        self.install()
        p, b = self.make_pack([b"new", b"new asset"], "v2")
        r = self.install(p, b)
        backup = self.state / r["transaction"] / "before" / self.names[0]
        backup.write_bytes(b"damaged")
        with self.assertRaises(core.PackError):
            self.rollback(r["transaction"])
        self.assertEqual(core.verify(self.game, p)["matched"], 2)

    def test_wrong_build_rejected(self):
        (self.base / "steamapps/appmanifest_4115450.acf").write_text('"buildid" "999"')
        with self.assertRaises(core.PackError):
            self.install()

    def test_game_running_guard_no_changes(self):
        def busy():
            raise core.PackError("game running")
        with self.assertRaises(core.PackError):
            core.install(self.game, self.profile, self.bundle, self.state, self.userdata, guard=busy)
        self.assertFalse((self.game / self.names[0]).exists())

    def test_bad_hash_no_writes(self):
        with zipfile.ZipFile(self.bundle, "w") as z:
            z.writestr(self.names[0], b"script X1")
            z.writestr(self.names[1], b"asset v1")
        with self.assertRaises(core.PackError):
            self.install()
        self.assertFalse((self.game / self.names[0]).exists())

    def test_zip_traversal_and_duplicate_rejected(self):
        for extra in ("../escape", self.names[0], "ProjectPBZ/Saved/private.sav"):
            zpath = self.base / "bad.zip"
            with zipfile.ZipFile(zpath, "w") as z:
                z.writestr(self.names[0], b"script v1")
                z.writestr(self.names[1], b"asset v1")
                z.writestr(extra, b"attack")
            with self.assertRaises(core.PackError):
                core.check_bundle(zpath, self.profile)

    def test_manifest_path_case_and_reserved_rejections(self):
        path = self.base / "bad.json"
        for bad in ["../escape", "C:/Windows/evil.dll", "ProjectPBZ/Saved/test.sav",
                    "ProjectPBZ/PBZModLoader/mods/CON.js", "ProjectPBZ/PBZModLoader/mods/test.js:evil"]:
            p = json.loads(json.dumps(self.profile))
            p["files"][0]["path"] = bad
            core.write_json(path, p)
            with self.assertRaises(core.PackError):
                core.load_profile(path)
        p = json.loads(json.dumps(self.profile))
        p["files"].append(dict(p["files"][0], path=p["files"][0]["path"].upper()))
        core.write_json(path, p)
        with self.assertRaises(core.PackError):
            core.load_profile(path)

    def test_symlink_blocked(self):
        folder = self.game / "ProjectPBZ/PBZModLoader"
        folder.mkdir()
        outside = self.base / "outside"
        outside.mkdir()
        try:
            (folder / "mods").symlink_to(outside, target_is_directory=True)
        except OSError:
            self.skipTest("Symlink creation privilege unavailable")
        with self.assertRaises(core.PackError):
            self.install()
        self.assertEqual(list(outside.iterdir()), [])

    def test_state_inside_game_rejected(self):
        with self.assertRaises(core.PackError):
            core.install(self.game, self.profile, self.bundle, self.game / "backup", self.userdata, guard=lambda: None)

    def test_hardlinked_target_rejected(self):
        outside = self.base / "outside.js"
        outside.write_bytes(b"do not modify")
        target = self.game / self.names[0]
        target.parent.mkdir(parents=True)
        os.link(outside, target)
        with self.assertRaises(core.PackError):
            self.install()
        self.assertEqual(outside.read_bytes(), b"do not modify")

    def test_lock_prevents_parallel_writes(self):
        with core.transaction_lock(self.state), self.assertRaises(core.PackError):
            self.install()

    def test_export_roundtrip(self):
        self.install()
        out = self.base / "export.zip"
        core.create_bundle(self.game, self.profile, out)
        self.assertTrue(core.check_bundle(out, self.profile)["verified"])


class PublicProfileTests(unittest.TestCase):
    def test_current_profile_is_portable_and_consistent(self):
        root = Path(__file__).resolve().parents[1]
        p = core.load_profile(root / "profiles/current.lock.json")
        outfits = core.read_json(root / "profiles/outfits.json")["outfits"]
        self.assertEqual(len(outfits), p["wardrobe_outfits"])
        self.assertEqual(len({x["id"].casefold() for x in outfits}), len(outfits))
        self.assertEqual(next(x for x in outfits if x["id"] == "Hun_OutFit_HuanGuiCoat")["name"], "幻鬼")
        self.assertNotIn("Hun_OutFit_CodexHuanGuiGreenDress", [x["id"] for x in outfits])
        paths = [f["path"] for f in p["files"]]
        self.assertFalse(any("Saved/" in x or "generated-mods" in x or x.endswith(".log") for x in paths))
        self.assertFalse(any(x.endswith(("/log.txt", "/track.txt", "/fogcache.txt")) for x in paths))
        self.assertIn("platform/steam/version.dll", paths)
        self.assertIn("platform/steam/dwmapi.dll", paths)


if __name__ == "__main__":
    unittest.main()
