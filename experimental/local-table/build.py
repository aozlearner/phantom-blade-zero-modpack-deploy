"""Emit UAssetAPI JSON from a private runtime export. Does not install anything."""
import argparse
import json
from pathlib import Path
from local_table import build


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--export', dest='export_path', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    exported = json.loads(args.export_path.read_text(encoding='utf-8-sig'))
    rows = exported.get('rows')
    if exported.get('rowStruct') != 'PBZAppearanceStruct' or not isinstance(rows, dict) or not rows:
        parser.error('Expected a complete PBZAppearanceStruct runtime export')
    if exported.get('totalRows') != len(rows) or exported.get('count') != len(rows):
        parser.error('Incomplete or paginated runtime export')
    if len({name.casefold() for name in rows}) != len(rows):
        parser.error('Duplicate case-insensitive row IDs')
    data = build(rows)
    # Refuse to overwrite either the source or an existing output.
    with args.output.open('x', encoding='utf-8') as target:
        json.dump(data, target, ensure_ascii=False, indent=2)
    print(f'Wrote {len(rows)} rows to a private, isolated table description.')


if __name__ == '__main__':
    main()
