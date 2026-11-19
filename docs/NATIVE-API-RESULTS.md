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

## Next implementation boundary

The proposed in-memory registration is not ready. A separately authored local table builder or another verified typed registration bridge is required. Exporting/compiling a table locally must preserve the player's native rows and must not depend on a redistributed private mod table. Neither route has been validated yet.

This evidence does not validate retargeting, grip, face animation, clothing, voice routing or portraits for the 68 outfits. The private reference bundle remains separate from the unfinished public replacement.

## 中文说明

正式版允许读取衣柜表，但 JSON 写接口明确返回“Shipping 不可用”；另一个新增行接口返回失败，不能直接把 SDK 声明当作可用能力。原生骨骼接口只做了基本调用检查，尚不能证明角色动作或附件正确。

后续需验证本机生成衣柜表或独立的类型桥接实现。完整公开替代版目前不可安装；测试结束已退出游戏并清理临时文件，实际游戏保持无 MOD 状态。用户已授权整套准备妥当后备份安装，再由用户实战测试。
