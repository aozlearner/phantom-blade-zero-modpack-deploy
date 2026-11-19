# Native-reference runtime research / 原生资源适配实验

This directory is **not an installable replacement** for the recorded character pack. It is excluded from every deployment manifest. No game models, audio, existing character-mod JavaScript, or serialized animation graphs are included.

`retarget.js` is a newly written, engine-independent reference-relative forward-kinematics implementation. It preserves target segment lengths and applies driver rotation changes relative to the driver's own reference pose. It does not yet solve grip IK, cloth, face animation, special attachment chains, wardrobe UI, or audio routing. Passing its arithmetic tests is not evidence of in-game compatibility.

```text
node experimental/native-runtime/retarget.test.js
```

此目录用于替换旧适配依赖的研究，**不能直接安装**。已独立编写相对参考姿势计算、两段式手臂 IK、语音选择规则与离线测试，没有附带游戏资源或复制旧作者的动画图。衣柜注册、引擎接入、实际握持、头部、衣料和声音播放都需要分别实现并验证，不能把离线测试通过写成 68 个角色已可用。

Runtime API declarations found in the upstream loader SDK are reflection output, not proof that their wildcard/struct parameters work from Puerts. A separate title-only transient-object probe is required before choosing the final wardrobe registration approach. It must not write original assets, unlock outfits, or load a save.

The [first title-only results](../../docs/NATIVE-API-RESULTS.md) are now recorded: native table reading works, the tested typed insertion returns false, and the JSON write API is disabled in Shipping. Poseable component calls passed a smoke test, not a visual or changed-pose round trip. Registration and the full replacement remain incomplete.

`node experimental/native-runtime/capabilities.test.js` verifies that these failures cannot be reported as successful registration simply because the probe finished without an exception.

`two-bone-ik.js` adds an independently written analytic limb solver. Its tests cover unreachable targets, differing proportions, folded/collinear limbs and preserved segment lengths. It computes joint positions only: engine bone rotations, grip/release blending, update order and in-game weapon contact remain to be integrated and verified. No inherited animation graph or sampled animation curve is embedded.

```text
node experimental/native-runtime/two-bone-ik.test.js
```

`voice-policy.js` independently implements the project rules: the selected female character's own combat events take priority; missing or failed categories fall back to Mu Xiao Kui. Only explicitly registered source events for the current player can be replaced, and only after a successful post. Original outfits, NPCs and dialogue pass through. This module still needs a verified engine hook, a locally discovered native-event catalog and actual listening tests. Its fixture event names are synthetic, not playable assets.

```text
node experimental/native-runtime/voice-policy.test.js
```
