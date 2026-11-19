# Reuse and replacement plan / 复用与替换范围

Keep the existing, verified work where its provenance permits it. The public-pack conversion is not a requirement to replace every file or rewrite the loader.

| Component | Decision | Current evidence |
| --- | --- | --- |
| PBZModLoader | Retain the unmodified upstream dependency, credit zoneoflkf and preserve license/source links | Pinned v1.0.4 release and digest |
| Project-authored hair protection | Reuse the latest source unchanged | Historical fix source/preparation workflow, baseline SHA-256, updated behavioral tests |
| Controlled Yu Er material repair | Reuse the source unchanged | Exact authored helper match, P2 body slot regression and native material path checks |
| Native model paths and assembly measurements | Retain factual configuration | 52 selected outfit configurations normalized; 16 remain |
| Other project-authored fixes, voice and UI integration | Review and retain their authored portions | Not all files have completed provenance review |
| Third-party scripts and animation graphs | Use under a verified compatible license, obtain permission, or independently replace the inherited portion | Similar names or small edits do not change the original license |
| Game models, textures, cloth, groom, audio | Load from the player's local game | Do not distribute copied game assets |

Comparison of 664 baseline scripts against 65 available reference scripts found 318 text-identical and 128 renaming-normalized matches. These are script counts, not character/mod counts. Many characters reuse the same small group of underlying implementations. The remaining unmatched files are **not automatically original**: edits, formatting or incomplete reference coverage also explain a mismatch. No fuzzy match is being used as a license determination.

The immediate retained code and configuration are listed in [`reuse-audit.json`](../profiles/reuse-audit.json). Existing third-party `Registry` and cinematic implementations were found in the downloaded reference packages and are not being reclassified as authored here.

## 当前交付状态

已保留并验证头发保护和受控玉儿材质修复源码，整理了 52 项角色资源与装配配置。语音、衣柜和角色修复按模块继续核对；只替换需要替换的来源部分。前面新写的实验模块保留供需要时使用，不要求它们取代所有已验证的旧逻辑。

`runtime/ownership.js` 是新编写的组件所有权管理，负责衣装 ID 冲突检查、旧外观清理后再激活新外观、不同 actor 隔离，以及清理失败后的阻断和重试。它使用新的 `prepare / begin / dispose` 契约，不是旧 Registry 的直接替换文件；尚未接入游戏 provider，也不向游戏衣柜表注册行。

完整替代包仍未就绪。不得因为旧包可用、源码已上传或离线测试通过，就宣称公开安装包已经能复现全部衣装。准备完整候选后再备份、安装并由玩家实战测试。
