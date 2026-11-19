# Phantom Blade Zero Modpack Deploy

[简体中文](README.md) · [Agent runbook (Chinese)](docs/AGENT_RUNBOOK.md) · [MIT License](LICENSE)

A standalone Python deployment project for **Phantom Blade Zero (影之刃零 / 影之刃0 / PBZ / ProjectPBZ)** mods. It provides a fixed file manifest, installation planning, backups, verification, and reversible transactions for a recorded wardrobe modpack.

**No Skill or particular agent platform is required.**

## Recorded baseline

| Item | Value |
| --- | --- |
| Steam app / build | 4115450 / 26367565 |
| Title version | 302256-17280 |
| Snapshot date | 2026-11-19 |
| Wardrobe outfits | 68 |
| Deployment files | 812 — files, not separate mods |
| Included components in the separate bundle | PBZModLoader, character outfits, scoped combat voices, hair-material protection, thumbnails; Map Collectible Markers and UE4SS are excluded |

The reference installation was backed up and uninstalled after this snapshot. This repository preserves that earlier combination for reproduction; it does not imply those mods are still installed on the maintainer's machine.

## Public-resource conversion status

A [per-file provenance audit](profiles/distribution-audit.json) is in progress. The 812-file ZIP is still a private reference snapshot, **not a cleared public resource release**. Repackaged Bai Chi Lian/Yu Yao meshes, audio copies, and inherited animation adaptation code need replacement. Referencing local game assets does not by itself clear third-party code rights.

**Implementation decision: retain [PBZModLoader by zoneoflkf](https://github.com/zoneoflkf/PBZModLoader) and independently implement the inherited character scripts and animation adaptation.** The unmodified upstream loader remains an external dependency. See the [pinned release and SHA-256](profiles/loader-dependency.json) and [third-party acknowledgements, source and GPL notice](THIRD_PARTY_NOTICES.md). Failed candidate game DataTable write calls do not indicate loader failure and do not change this dependency decision.

## Asset requirement

**Cloning this repository alone cannot install the complete modpack.** You also need a legally accessible matching game and the separate asset ZIP matching `profiles/current.lock.json`. That custom bundle currently has **no public download URL**. Original upstream downloads are not drop-in replacements for the combined, adapted baseline.

The public repository contains deployment code, hashes, metadata, documentation, and tests. It does not include character models, audio, third-party mod binaries, saves, runtime logs, tracking caches, or credentials. The MIT license covers the deployment project, not those separate assets. See [sources and distribution boundaries](docs/SOURCES.md).

## Quick start

Requirements: Windows, Python 3.10+, the supported Steam build, and the matching resource ZIP. There are no third-party Python runtime dependencies. Run commands from the repository root, replacing the example paths. Keep private backups outside both the game and Git repository.

```powershell
git clone https://github.com/aozlearner/phantom-blade-zero-modpack-deploy.git
cd phantom-blade-zero-modpack-deploy

python -m pbzpack check-bundle --bundle "D:\ModResources\pbz-wardrobe-baseline.zip"
python -m pbzpack plan --game "D:\SteamLibrary\steamapps\common\PBZ" --state-dir "D:\PBZ-Private-Backups"
```

The plan must have no conflicts. Add `--details` to print every action. Unknown mods and conflicting existing files require explicit review; there is no force-overwrite option. Conflict detection covers the managed mod directories and common proxy DLLs, not every possible game modification.

Switch to an original or retained working outfit, save, and exit the game before installation. Keep it closed throughout:

```powershell
python -m pbzpack install --game "D:\SteamLibrary\steamapps\common\PBZ" --bundle "D:\ModResources\pbz-wardrobe-baseline.zip" --state-dir "D:\PBZ-Private-Backups"
python -m pbzpack verify --game "D:\SteamLibrary\steamapps\common\PBZ"
```

The installer checks the game build and Windows processes, validates the entire bundle, backs up current managed files and saves, writes the planned changes, and verifies every target hash. Steam userdata is discovered through the registry; supply `--steam-userdata "C:\Program Files (x86)\Steam\userdata"` if needed.

Save the returned transaction ID. `matched: 812` and an empty `problems` list mean the deployment files match. The tool **never launches the game or loads a save**. Players must verify outfits, combat voices, hair after weapon swaps/dashes, in their next play session. File integrity does not prove gameplay compatibility.

## Rollback and recovery

Save and exit, then use the actual transaction ID:

```powershell
python -m pbzpack rollback --game "D:\SteamLibrary\steamapps\common\PBZ" --state-dir "D:\PBZ-Private-Backups" --transaction "transactions/REPLACE_WITH_ACTUAL_32_HEX_ID"
```

Rollback restores the pre-transaction mod state. Files that already matched before installation remain in place. **Saves are backed up but never automatically restored**, preserving newer progress. User edits made after installation block destructive rollback. Roll back multiple transactions newest first.

A failed write leaves backups and a `failed` receipt. Close the game, resolve the underlying disk/permission problem, and roll back that transaction before another installation. After a crash, investigate any `operation.lock` and confirm no operation is still running before removing that stale lock and recovering. Do not discard the backup.

## Exporting a matching reference installation

```powershell
python -m pbzpack export --game "D:\SteamLibrary\steamapps\common\PBZ" --bundle "D:\ModResources\pbz-wardrobe-baseline.zip"
```

Only an installation matching the lockfile can be exported. Every archive member is checked again after compression. Existing output files are not overwritten. Saves, runtime logs, tracking caches, generated loader caches, and historical backups are excluded. Map markers and their UE4SS loader are no longer part of this profile.

## For agents and maintainers

- `profiles/current.lock.json`: file paths, sizes, SHA-256 hashes, and supported game version.
- `profiles/outfits.json`: 68 outfit IDs, display names, and providers.
- `docs/AGENT_RUNBOOK.md`: operational sequence and authorization boundaries.
- `docs/ARCHITECTURE.md`: animation, voice, material, registration, and thumbnail constraints.
- `docs/VALIDATION.md` and `docs/BASELINE-REPORT.md`: test scope and recorded evidence.
- `tests/`: fixture-based deployment tests; GitHub Actions runs Windows and Linux offline tests.

```powershell
python -m unittest discover -s tests -v
```

Linux supports offline testing only; real game mutation requires Windows. A different game build requires a fresh resource audit and validated baseline, not merely editing the build number in the manifest.

[Phantom Blade Zero Wardrobe Skill](https://github.com/aozlearner/phantom-blade-zero-wardrobe-skill) is the separate authoring guide. Neither repository depends on the other at runtime. This is an independent community project, not affiliated with the developer or publisher.
