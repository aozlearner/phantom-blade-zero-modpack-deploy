import argparse
from collections import Counter
import json
from pathlib import Path
import sys

from . import core


def main(argv=None):
    parser = argparse.ArgumentParser(description="PBZ locked modpack deployment (never launches the game)")
    parser.add_argument("--profile", type=Path, default=Path(__file__).resolve().parent.parent / "profiles/current.lock.json")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ["verify", "plan", "export", "install"]:
        p = sub.add_parser(name)
        p.add_argument("--game", required=True, type=Path, help="PBZ root containing ProjectPBZ and platform")
        if name in ("plan", "install"):
            p.add_argument("--state-dir", required=True, type=Path, help="Private backups/state, outside game and repository")
        if name == "plan":
            p.add_argument("--details", action="store_true", help="Print every file action")
        if name in ("export", "install"):
            p.add_argument("--bundle", required=True, type=Path)
        if name == "install":
            p.add_argument("--steam-userdata", type=Path, help="Steam userdata directory; otherwise use registry discovery")
    p = sub.add_parser("check-bundle")
    p.add_argument("--bundle", required=True, type=Path)
    p = sub.add_parser("rollback")
    p.add_argument("--game", required=True, type=Path)
    p.add_argument("--state-dir", required=True, type=Path)
    p.add_argument("--transaction", required=True)
    try:
        args = parser.parse_args(argv)
        if args.command == "rollback":
            result = core.rollback(args.game, args.state_dir, args.transaction)
        else:
            profile = core.load_profile(args.profile)
            if args.command == "verify":
                core.check_game(args.game, profile)
                result = core.verify(args.game, profile)
            elif args.command == "plan":
                core.check_game(args.game, profile)
                result = core.plan(args.game, profile, args.state_dir)
                result["counts"] = dict(Counter(a["action"] for a in result["actions"]))
                if not args.details:
                    result.pop("actions")
            elif args.command == "export":
                core.check_game(args.game, profile)
                result = core.create_bundle(args.game, profile, args.bundle)
            elif args.command == "check-bundle":
                result = core.check_bundle(args.bundle, profile)
            elif args.command == "install":
                result = core.install(args.game, profile, args.bundle, args.state_dir, args.steam_userdata)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 2 if result.get("problems") or result.get("conflicts") else 0
    except (core.PackError, OSError, ValueError, KeyError) as e:
        print("ERROR: " + str(e), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
