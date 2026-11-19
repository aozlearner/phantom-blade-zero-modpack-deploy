"""Content verification and reversible installation using the Python standard library."""
from __future__ import annotations

import contextlib
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import tempfile
import uuid
import zipfile


class PackError(Exception):
    pass


def digest(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".tmp-" + uuid.uuid4().hex)
    try:
        temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def relative_name(value):
    if not isinstance(value, str) or "\\" in value or ":" in value:
        raise PackError("Paths must be portable relative POSIX paths")
    p = PurePosixPath(value)
    if p.is_absolute() or str(p) != value or not p.parts:
        raise PackError("Non-canonical path: " + value)
    for part in p.parts:
        if part in (".", "..") or part.endswith((".", " ")) or any(c in part for c in '<>"|?*'):
            raise PackError("Unsafe path: " + value)
        if any(ord(c) < 32 for c in part) or re.fullmatch(r"(?i)(con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\..*)?", part):
            raise PackError("Reserved path: " + value)
    return p


def managed_name(value):
    relative_name(value)
    allowed = (
        "ProjectPBZ/Content/Paks/~mods/",
        "ProjectPBZ/PBZModLoader/mods/",
        "ProjectPBZ/PBZModLoader/compiler/",
        "platform/steam/ue4ss/",
    )
    exact = {
        "platform/steam/version.dll", "platform/steam/dwmapi.dll",
        "ProjectPBZ/PBZModLoader/mods.ini", "ProjectPBZ/PBZModLoader/TOOLCHAIN-LICENSE.txt",
        "ProjectPBZ/Content/JavaScript/PBZModLoader/bootstrap.js",
        "ProjectPBZ/Content/JavaScript/PBZModLoader/manager.js",
    }
    if value not in exact and not value.startswith(allowed):
        raise PackError("Outside managed mod locations: " + value)
    return value


def safe_path(root, relative):
    """Reject symlinks, junctions/reparse points and hardlinked files before access."""
    relative_name(relative)
    root = Path(root).absolute()
    path = root.joinpath(*PurePosixPath(relative).parts)
    for p in [*reversed(root.parents), root, *[root.joinpath(*PurePosixPath(relative).parts[:i])
              for i in range(1, len(PurePosixPath(relative).parts) + 1)]]:
        try:
            st = p.lstat()
        except FileNotFoundError:
            continue
        if stat.S_ISLNK(st.st_mode) or getattr(st, "st_file_attributes", 0) & 0x400:
            raise PackError("Link/junction not permitted: " + str(p))
        if stat.S_ISREG(st.st_mode) and st.st_nlink > 1:
            raise PackError("Hardlinked file not permitted: " + str(p))
    if not path.resolve().is_relative_to(root.resolve()):
        raise PackError("Path escapes root")
    return path


def load_profile(path):
    p = read_json(path)
    if p.get("schema") != 1 or not p.get("files") or not re.fullmatch(r"\d+", p.get("steam_build", "")):
        raise PackError("Invalid profile schema or Steam build")
    seen = set()
    for f in p["files"]:
        n = managed_name(f["path"])
        if n.casefold() in seen or not re.fullmatch("[0-9a-f]{64}", f["sha256"]) or not isinstance(f["size"], int) or f["size"] < 0:
            raise PackError("Invalid or duplicate manifest entry: " + n)
        seen.add(n.casefold())
    for n in seen:
        if any(str(parent) in seen for parent in PurePosixPath(n).parents):
            raise PackError("Manifest file/directory collision: " + n)
    return p


def file_status(root, entry):
    p = safe_path(root, entry["path"])
    if not p.exists():
        return "missing"
    if not p.is_file():
        raise PackError("Expected regular file: " + str(p))
    return "match" if p.stat().st_size == entry["size"] and digest(p) == entry["sha256"] else "different"


def verify(root, profile):
    results = [{"path": f["path"], "status": file_status(root, f)} for f in profile["files"]]
    return {"total": len(results), "matched": sum(f["status"] == "match" for f in results),
            "problems": [f for f in results if f["status"] != "match"]}


def create_bundle(root, profile, destination):
    destination = Path(destination)
    if destination.exists():
        raise PackError("Bundle destination already exists")
    report = verify(root, profile)
    if report["problems"]:
        raise PackError("Reference installation differs: " + json.dumps(report["problems"][:10]))
    destination.parent.mkdir(parents=True, exist_ok=True)
    tmp = destination.with_suffix(".partial-" + uuid.uuid4().hex)
    try:
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as z:
            for f in profile["files"]:
                z.write(safe_path(root, f["path"]), f["path"])
        # Reopen and verify every compressed member; catches changes during export.
        check_bundle(tmp, profile)
        os.replace(tmp, destination)
    finally:
        tmp.unlink(missing_ok=True)
    return {"files": len(profile["files"]), "sha256": digest(destination), "bytes": destination.stat().st_size}


def check_bundle(bundle, profile, extract_to=None):
    expected = {f["path"]: f for f in profile["files"]}
    with zipfile.ZipFile(bundle) as z:
        infos = z.infolist()
        if len(infos) != len(expected) or {i.filename for i in infos} != set(expected):
            raise PackError("Bundle must contain exactly the manifest files (no duplicates/extras)")
        for info in infos:
            f = expected[info.filename]
            mode = info.external_attr >> 16
            if (stat.S_IFMT(mode) not in (0, stat.S_IFREG)) or info.file_size != f["size"] or info.flag_bits & 1:
                raise PackError("Invalid archive entry: " + info.filename)
            h = hashlib.sha256()
            target = safe_path(extract_to, info.filename) if extract_to else None
            if target:
                target.parent.mkdir(parents=True, exist_ok=True)
            with z.open(info) as src, (target.open("xb") if target else contextlib.nullcontext()) as dst:
                for block in iter(lambda: src.read(1024 * 1024), b""):
                    h.update(block)
                    if dst:
                        dst.write(block)
            if h.hexdigest() != f["sha256"]:
                raise PackError("Bundle checksum mismatch: " + info.filename)
    return {"files": len(expected), "verified": True}


def assert_closed():
    if os.name != "nt":
        raise PackError("Game mutation is supported on Windows only")
    # Never treat a failed process query as 'game closed'. No CLI bypass.
    command = "$ErrorActionPreference='Stop'; Get-CimInstance Win32_Process | Select-Object -ExpandProperty Name | ConvertTo-Json -Compress"
    result = subprocess.run(["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", command],
                            capture_output=True, text=True, timeout=30)
    if result.returncode:
        raise PackError("Cannot inspect processes; run with permission to read the real Windows process list")
    try:
        names = json.loads(result.stdout)
    except ValueError as e:
        raise PackError("Invalid process query result") from e
    if not isinstance(names, list) or not names:
        raise PackError("Process visibility unavailable")
    if any(re.match(r"(?i)^(projectpbz|pbz)(?:[-.]|$)", n) for n in names):
        raise PackError("Save, switch to a retained outfit, then exit PBZ before installing")


def check_game(root, profile):
    root = Path(root).absolute()
    if not safe_path(root, "platform/steam/PBZ.exe").is_file() or not (root / "ProjectPBZ/Content/Paks").is_dir():
        raise PackError("Not a supported PBZ game root")
    manifest = root.parent.parent / "appmanifest_4115450.acf"
    if not manifest.is_file():
        raise PackError("Steam manifest missing; only the locked Steam build is supported")
    text = manifest.read_text(encoding="utf-8-sig")
    match = re.search(r'"buildid"\s+"(\d+)"', text)
    if not match or match[1] != profile["steam_build"]:
        raise PackError("Unsupported Steam build; audit resources before updating the profile")


def current_files(root):
    """Conflict-sensitive locations; runtime-generated caches/logs are deliberately omitted."""
    root = Path(root)
    paths = ["ProjectPBZ/Content/Paks/~mods", "ProjectPBZ/PBZModLoader/mods", "platform/steam/ue4ss/Mods"]
    generated = {
        "platform/steam/ue4ss/Mods/PBZMapMarkers/log.txt",
        "platform/steam/ue4ss/Mods/PBZMapMarkers/track.txt",
        "platform/steam/ue4ss/Mods/PBZMapMarkers/fogcache.txt",
    }
    files = []
    for rel in paths:
        base = safe_path(root, rel)
        if base.exists():
            for p in base.rglob("*"):
                name = p.relative_to(root).as_posix()
                safe_path(root, name)
                if p.is_file() and name not in generated:
                    files.append(name)
    for name in ["version.dll", "dwmapi.dll", "winmm.dll", "dinput8.dll", "dxgi.dll", "xinput1_3.dll"]:
        rel = "platform/steam/" + name
        if safe_path(root, rel).exists():
            files.append(rel)
    return files


def active_receipt(state, root):
    pointer = Path(state) / "active.json"
    if not pointer.exists():
        return None
    active = read_json(pointer)
    tx = safe_path(state, active["transaction"])
    r = read_json(tx / "receipt.json")
    if Path(r["game"]).resolve() != Path(root).resolve() or r["status"] != "installed":
        raise PackError("State directory belongs to another or incomplete installation")
    return r


def plan(root, profile, state):
    prior = active_receipt(state, root)
    old = {f["path"]: f for f in prior["files"]} if prior else {}
    new = {f["path"]: f for f in profile["files"]}
    actions, conflicts = [], []
    for name, f in new.items():
        status = file_status(root, f)
        if name in old and file_status(root, old[name]) != "match" and status != "match":
            conflicts.append(name + " (managed file drift)")
        elif status == "match":
            actions.append({"path": name, "action": "keep"})
        elif status == "missing":
            actions.append({"path": name, "action": "create"})
        elif name in old and file_status(root, old[name]) == "match":
            actions.append({"path": name, "action": "replace"})
        else:
            conflicts.append(name + " (unowned existing file)")
    for name, f in old.items():
        if name not in new:
            if file_status(root, f) != "match":
                conflicts.append(name + " (obsolete managed file drift)")
            else:
                actions.append({"path": name, "action": "remove"})
    known = {x.casefold() for x in set(old) | set(new)}
    for name in current_files(root):
        if name.casefold() not in known:
            conflicts.append(name + " (unknown mod; resolve explicitly first)")
    return {"profile": profile["id"], "actions": actions, "conflicts": conflicts}


def discover_saves(root, steam_userdata=None):
    candidates = [("game-saves", Path(root) / "ProjectPBZ/Saved", True)]
    if os.environ.get("LOCALAPPDATA"):
        candidates.append(("local-saves", Path(os.environ["LOCALAPPDATA"]) / "ProjectPBZ/Saved", True))
    if not steam_userdata and os.name == "nt":
        import winreg
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam") as key:
                steam_userdata = Path(winreg.QueryValueEx(key, "SteamPath")[0]) / "userdata"
        except FileNotFoundError:
            pass
    if steam_userdata:
        users = Path(steam_userdata)
        if not users.is_dir():
            raise PackError("Steam userdata path is not a directory")
        for user in users.iterdir():
            if user.is_dir() and user.name.isdigit():
                candidates.append(("steam-" + user.name, user / "4115450", False))
    elif os.name == "nt":
        raise PackError("Cannot locate Steam userdata; specify --steam-userdata for save backup")
    files = []
    for label, base, sav_only in candidates:
        safe_path(base.parent, base.name)
        if base.exists():
            for p in base.rglob("*"):
                safe_path(base, p.relative_to(base).as_posix())
                if p.is_file() and (not sav_only or p.suffix.lower() == ".sav"):
                    files.append((label + "/" + p.relative_to(base).as_posix(), p))
    return files


def copy_verified(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    before = digest(source)
    shutil.copy2(source, destination)
    if digest(source) != before or digest(destination) != before:
        raise PackError("Copy verification failed: " + str(source))
    return before


def atomic_copy(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    temp = destination.with_name(destination.name + ".pbzpack-" + uuid.uuid4().hex)
    try:
        copy_verified(source, temp)
        os.replace(temp, destination)
    finally:
        temp.unlink(missing_ok=True)


def validate_state(root, state):
    root, state = Path(root).resolve(), Path(state).absolute()
    safe_path(state.parent, state.name)
    if state.resolve().is_relative_to(root) or root.is_relative_to(state.resolve()):
        raise PackError("Keep private backups outside the game directory and its ancestors")


@contextlib.contextmanager
def transaction_lock(state):
    state = Path(state)
    state.mkdir(parents=True, exist_ok=True)
    path = safe_path(state, "operation.lock")
    try:
        f = path.open("x", encoding="utf-8")
    except FileExistsError as e:
        raise PackError("Another operation is active; investigate operation.lock before retrying") from e
    try:
        with f:
            f.write(str(os.getpid()))
        yield
    finally:
        path.unlink()


def install(root, profile, bundle, state, steam_userdata=None, *, guard=assert_closed):
    root, state = Path(root).absolute(), Path(state).absolute()
    validate_state(root, state)
    check_game(root, profile)
    guard()
    with transaction_lock(state):
        # Refuse a new operation if a previous transaction is unresolved.
        for r in state.glob("transactions/*/receipt.json"):
            if read_json(r)["status"] in ("prepared", "installing", "failed", "rolling_back"):
                raise PackError("Recover the incomplete transaction first: " + str(r.parent))
        p = plan(root, profile, state)
        if p["conflicts"]:
            raise PackError("Conflicts: " + json.dumps(p["conflicts"][:20]))
        with tempfile.TemporaryDirectory(prefix="pbzpack-stage-") as scratch:
            stage = Path(scratch)
            check_bundle(bundle, profile, stage)
            txid = "transactions/" + uuid.uuid4().hex
            tx = safe_path(state, txid)
            tx.mkdir(parents=True)
            backups = []
            # Snapshot all current manifest-owned files, including unchanged dependencies.
            for a in p["actions"]:
                src = safe_path(root, a["path"])
                if src.exists():
                    h = copy_verified(src, safe_path(tx / "before", a["path"]))
                    backups.append({"path": a["path"], "sha256": h})
            saves = []
            for name, src in discover_saves(root, steam_userdata):
                h = copy_verified(src, safe_path(tx / "saves", name))
                saves.append({"backup": name, "sha256": h, "source": str(src)})
            previous = read_json(state / "active.json") if (state / "active.json").exists() else None
            receipt = {"schema": 1, "transaction": txid, "game": str(root), "status": "prepared",
                       "profile": profile["id"], "files": profile["files"], "actions": p["actions"],
                       "before": backups, "saves": saves, "previous": previous}
            write_json(tx / "receipt.json", receipt)
            try:
                guard()
                # Detect files changed while backing up, before any game write.
                if plan(root, profile, state) != p:
                    raise PackError("Installation changed while preparing backup")
                for b in backups:
                    if digest(safe_path(root, b["path"])) != b["sha256"]:
                        raise PackError("File changed during backup: " + b["path"])
                receipt["status"] = "installing"
                write_json(tx / "receipt.json", receipt)
                for index, a in enumerate(p["actions"]):
                    if a["action"] == "keep":
                        continue
                    if index % 32 == 0:
                        guard()
                    dst = safe_path(root, a["path"])
                    if a["action"] == "remove":
                        dst.unlink()
                    else:
                        atomic_copy(safe_path(stage, a["path"]), dst)
                guard()
                if verify(root, profile)["problems"]:
                    raise PackError("Post-install verification failed")
                receipt["status"] = "installed"
                write_json(tx / "receipt.json", receipt)
                write_json(state / "active.json", {"transaction": txid})
            except Exception:
                receipt["status"] = "failed"
                write_json(tx / "receipt.json", receipt)
                # Preserve backups and a recoverable receipt even if the game reopens.
                raise
    return {"transaction": txid, "files": len(profile["files"]), "saves_backed_up": len(saves), "status": "installed"}


def rollback(root, state, transaction, *, guard=assert_closed):
    root, state = Path(root).absolute(), Path(state).absolute()
    validate_state(root, state)
    relative_name(transaction)
    if not re.fullmatch(r"transactions/[0-9a-f]{32}", transaction):
        raise PackError("Invalid transaction identifier")
    guard()
    with transaction_lock(state):
        tx = safe_path(state, transaction)
        r = read_json(tx / "receipt.json")
        if Path(r["game"]).resolve() != root.resolve() or r["status"] == "rolled_back":
            raise PackError("Wrong game or transaction already rolled back")
        active = read_json(state / "active.json") if (state / "active.json").exists() else None
        if active and active["transaction"] not in (transaction, (r.get("previous") or {}).get("transaction")):
            raise PackError("Rollback newer transactions first")
        before = {f["path"]: f for f in r["before"]}
        after = {f["path"]: f for f in r["files"]}
        changes = [a for a in r["actions"] if a["action"] != "keep"]
        # Validate ALL backups and current files before restoring anything.
        for a in changes:
            name = managed_name(a["path"])
            dst = safe_path(root, name)
            old, new = before.get(name), after.get(name)
            if old and digest(safe_path(tx / "before", name)) != old["sha256"]:
                raise PackError("Backup damaged: " + name)
            expected = {x["sha256"] for x in (old, new) if x}
            if dst.exists() and digest(dst) not in expected:
                raise PackError("Refusing to overwrite post-install edits: " + name)
            if not dst.exists() and a["action"] == "replace":
                raise PackError("Managed file unexpectedly missing: " + name)
        r["status"] = "rolling_back"
        write_json(tx / "receipt.json", r)
        for index, a in enumerate(reversed(changes)):
            if index % 32 == 0:
                guard()
            name = a["path"]
            dst = safe_path(root, name)
            if name in before:
                atomic_copy(safe_path(tx / "before", name), dst)
            else:
                dst.unlink(missing_ok=True)
        r["status"] = "rolled_back"
        write_json(tx / "receipt.json", r)
        if r.get("previous"):
            write_json(state / "active.json", r["previous"])
        else:
            (state / "active.json").unlink(missing_ok=True)
    return {"status": "rolled_back", "restored_files": len(changes), "saves_restored": False}
