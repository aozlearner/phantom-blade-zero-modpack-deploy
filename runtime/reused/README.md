# Retained project code / 沿用本工程既有实现

This directory keeps reviewed project-authored code from the working private baseline. Rebuilding the public distribution does not require rewriting our own fixes. It is not a standalone mod entry point and is not yet included in a deployment manifest.

这里保存经核对可沿用的本工程既有代码。公开安装工程的整理不要求把我们自己写的修复推倒重来。此目录尚无独立 MOD 入口，也未纳入安装清单。

`HairMaterialGuard.js` is byte-identical to the latest private reference version. It retains the 68-outfit allowlist, repeated material replacement handling, controlled Yu Er white-hair override, and ownership/sequence exclusions. Its old behavioral tests were ported to the current roster; obsolete assertions tying hair protection to the female-voice list were removed.

`HairMaterialGuard.js` 与最新私人参考包中的文件逐字节一致，保留当前 68 项衣装的保护范围、连续材质覆盖处理、受控玉儿白发与角色/过场隔离。旧回归测试已更新为当前衣装清单，去掉“头发保护名单必须等于女性语音名单”的历史断言。

Use `create(UE, report)`, `step(context)` and `dispose()` under the new runtime's scheduler. The retained legacy `start()` helper has no stop method; do not use it in a reloadable entry point. Reusing the guard does not resolve the missing renderer or wardrobe registration.

```text
node runtime/reused/HairMaterialGuard.test.js
```

`YuErControlledMaterials.js` is also retained byte-for-byte from the authored material-slot repair. Its regression test covers the observed P2 body slot, face/eye overrides, untouched unknown slots and white hair. The fixture contains six native path strings previously checked in a local resource scan, not textures or game exports. Run `node runtime/reused/YuErControlledMaterials.test.js`.

[`reuse-audit.json`](../../profiles/reuse-audit.json) records the baseline hash and review evidence. [`native-models.partial.json`](../../profiles/native-models.partial.json) retains factual asset paths and assembly parameters for 52 existing outfits, not meshes, audio, animation graphs, or proof that the new renderer works. The other 16 still need their configuration normalized and native alternatives checked.
