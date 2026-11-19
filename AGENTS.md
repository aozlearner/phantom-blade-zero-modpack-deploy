# Working on this repository

This is a standalone deployment project, with no Skill dependency.

- Read `README.md` and `docs/AGENT_RUNBOOK.md` before installation.
- Work against temporary fixtures for tests. Never point a test installation at the user's real game.
- Preserve the fixed game build and file hashes unless a new baseline has been independently validated.
- Keep assets, ZIPs, saves, Steam userdata, logs, credentials and backup receipts outside the repository.
- Do not launch the game or load a save as part of installation. Any engine validation needs separate permission.
- Do not bypass process, conflict, link or checksum checks to make an installation pass.
- Test changes with `python -m unittest discover -s tests -v`; report skipped tests honestly.
- The repository MIT license applies to deployment code and documentation only. Do not silently relicense third-party mods or game assets.
