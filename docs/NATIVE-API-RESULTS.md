# Native API evidence / 原生接口验证

Title-only test, 2026-11-19. Steam build 26367565, title world `PBZ_StartMenu_CE_WP`. No save was loaded, no outfit was equipped or unlocked. The test created private transient objects; it did not modify the original appearance table.

| Check | Observed result | Interpretation |
| --- | --- | --- |
| Native appearance table | 54 rows before and after | Original table unchanged |
| `DataTableFL.AddDataTableRow` with a `PBZAppearanceStruct` | `false`; private table stayed empty | This tested Puerts call is unusable for registration; the reason is not established |
| `GetDataTableRowFromName` on the failed insertion | `false` | No successful round trip |
| `EasySDKUtils.GetDataTableRows` | Read native and private tables | Read access works |
| `EasySDKUtils.SetDataTableRow(..., false)` | `Debug actions are unavailable in Shipping` | This JSON write API is disabled in the tested game build |
| Private `PoseableMeshComponent` with native Hun mesh | 301 bones; reference transform and pose setter callable | Interface smoke test only; no changed-pose readback or visual proof |

The probe's `done: true` only means execution finished. Its zero exception count did **not** mean the boolean-returning APIs succeeded. `experimental/native-runtime/capabilities.test.js` protects this distinction.

The temporary 117-file loader/probe installation was backed up and removed, along with generated files (120 removed). The final active mod count was zero. Two title-screen settings files changed naturally; progress/cloud saves did not change. No save was restored over newer data. Private paths, game exports and full logs are not included here.

## Player-local table reconstruction

Further title-only tests verified an independently authored local table builder. A paced read-only export captured all 54 native rows. A new tagged table was generated from those local values, compiled with external UAssetGUI/UAssetAPI, packed with retoc, and loaded at an isolated `/Game/Mods/LocalWardrobeProbe/DT_LocalProbe` path. No old mod table or animation graph was used as its template.

The first live readback caught 58 differences: omitted zero linear/angular velocity scales on 29 native grooms had acquired constructor defaults of 1. Explicit zero serialization fixed this. The second live readback matched **all 55 rows and nested field values** (54 native rows plus one authored test row), including cloth, groom simulation parameters, textures, identity and enum fields. All 314 log fragments were collected and checked. The native table stayed at 54 rows.

Both sessions backed up 32 save/cloud files before testing. Each temporary 120-file installation and its generated files was backed up and removed (123 files per cleanup). No progress/cloud save changed; only the two title-screen settings files changed. The game was closed and active MOD files returned to zero. The private exported tables, outputs, logs and backups are not published.

Source and synthetic regression tests are in [`experimental/local-table`](../experimental/local-table). This proves isolated engine loading and value preservation. It does **not** prove registration into the active wardrobe, custom display-name localization, unlock behavior, or gameplay. A portable, pinned compiler/packer workflow also remains to be integrated.

## Next implementation boundary

Direct in-memory row writes remain unavailable in the tested forms. Player-local cooked table generation now has title-only evidence, but the actual merged wardrobe installation still needs integration and verification.

This evidence does not validate retargeting, grip, face animation, clothing, voice routing or portraits for the 68 outfits. The private reference bundle remains separate from the unfinished public replacement.

## 中文说明

正式版允许读取衣柜表，但 JSON 写接口明确返回“Shipping 不可用”；另一个新增行接口返回失败，不能直接把 SDK 声明当作可用能力。原生骨骼接口只做了基本调用检查，尚不能证明角色动作或附件正确。

本机生成衣柜表已通过独立路径加载测试：原生 54 行加 1 行测试条目，游戏内逐字段比对通过，原表未改。测试发现并修复了导出省略零值造成的毛发物理参数变化。此结果尚不证明衣柜注册、解锁和全部角色适配完成。

完整公开替代版目前不可安装；测试结束已退出游戏并清理临时文件，实际游戏保持无 MOD 状态。用户已授权整套准备妥当后备份安装，再由用户实战测试。
