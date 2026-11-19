# Player-local table experiment / 玩家本机衣柜表实验

This independently written builder converts a **private runtime export from the player's game** into tagged UAssetAPI JSON. It does not use an old mod's table as a template. Generated JSON and cooked outputs contain native game data: keep them outside this public repository.

该工具独立生成衣柜表格式，输入来自玩家本机游戏的完整运行时导出，不以其他作者的旧表为模板。生成的 JSON 和编译产物包含原生游戏数据，应保存在公开仓库以外。

```powershell
python experimental/local-table/build.py --export <private-runtime-export.json> --output <new-private-table.json>
python -m unittest discover -s experimental/local-table -p "test_*.py" -v
```

The command only emits a description for the isolated asset `DT_LocalProbe`; it does not compile, pack, register, unlock, equip, launch, or install. It refuses partial exports, unknown fields, duplicate case-insensitive IDs and existing output files. This is a registration experiment, **not the completed 68-outfit installer**.

此命令只生成独立测试资源 `DT_LocalProbe` 的描述，不执行编译、打包、注册、解锁、换装、启动或安装。分页/不完整导出、未知字段、大小写冲突的 ID 和已有输出文件都会被拒绝。它用于验证注册方案，**不是已完成的 68 套衣柜安装器**。

## Format and validation

- Reflected field/type facts describe `PBZAppearanceStruct`, cloth, groom and native soft references. Unknown fields fail closed rather than disappear silently.
- Native export text omits zero values. Two groom velocity-scale fields have constructor defaults of 1, so the builder explicitly preserves omitted zero values. A regression test covers this distinction.
- `compare` checks all fields, array lengths, values and float precision; completing a compiler command is not sufficient evidence.
- All checked-in tests use synthetic data. Native tables, images, audio, logs, saves and compiled assets are not included.
- Current engine evidence and limits are recorded in [NATIVE-API-RESULTS.md](../../docs/NATIVE-API-RESULTS.md).

The local experiment used external UAssetGUI/UAssetAPI by atenfyr and retoc by Truman Kilen and Archengius. Obtain them from their upstream projects and retain their licenses; see [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md). No compiler binaries or copied serializer implementation are bundled here. A pinned, portable compiler workflow remains to be integrated.
