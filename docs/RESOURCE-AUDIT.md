# Resource audit / 资源审计（2026-11-19）

## 已确认的范围

地图未收集物品标记及其 UE4SS 加载链已排除，共 35 个文件、21,494,900 字节。当前私人候选保留 68 个衣柜条目、812 个文件；它不是已获完整公开许可的资源包。原始完整备份未改动，维护者游戏保持卸载状态。

| 类别 | 文件数 | 处理 |
| --- | ---: | --- |
| PBZModLoader 与工具链 | 116 | 从上游固定版本获取，保留 GPL 与各依赖许可；不改成 MIT |
| PAK/UTOC/UCAS 容器 | 24 | 不公开原包；核对导出并替换其运行依赖 |
| 运行脚本等 | 664 | 逐项查来源；角色名改变不意味着算法变成原创 |
| 人物 PNG | 8 | 优先本地原生图鉴纹理，必要时让用户本机生成 |

完整路径、哈希和处置类别见 [`distribution-audit.json`](../profiles/distribution-audit.json)。分类是来源审查状态，不是法律授权证明。

## 容器实际内容

使用 retoc 读取 8 个容器的索引，发现 268 个动画图导出、8 份衣柜表导出、4 个网格导出、3 个音频导出。重复的衣柜表路径代表各历史包各带一份表，不是 8 张互相独立的表。

- 白赤练容器包含 `SK_BaiLongHeadNoMask`、`SK_BaiHeadNoMask`、`SK_BaiMaskFollower` 三个网格及 bulk data；还有 BattleBreak、Hurt、Death 的本地音频数据。即使人物来自游戏，这些也是现成包里的派生资源副本。
- 玉妖容器包含 `Yuu_Body` 网格及 bulk data。
- 其他多数容器内容是动画适配图和衣柜表，不能据文件较小就认定为可自由公开的补丁。
- 衣柜扩展的构建历史确实克隆了已有角色的动画图及脚本族。视觉脚本包含原玉鼎参考姿势/握持实现的依赖；语音的历史实现也注明参考了白赤练的播放拦截方法。需要按具体实现核对来源或重新实现，不能整包更名后套 MIT。

## 公开实现路线

1. 资源地址、角色 ID、原生组件类型与必要的装配测量作为配置记录；模型、贴图、衣料、Groom 和语音从玩家自己的游戏加载。
2. 先验证游戏内运行时 DataTable API 能否安全接收完整类型的衣柜行，再选择内存注册或本机生成表补丁。SDK 存在函数声明不等于 Puerts 调用已验证；禁止直接把空行或错误结构写进原表。
3. 动作驱动独立实现相对参考姿势计算，并单独解决握持、头部/面部、衣料和附件。`experimental/native-runtime` 只有初步计算模块，不是完成的替代 renderer。
4. 白赤练面具尝试使用原生部件/材质区段可见性；玉妖使用原生身体。必须核验结果，不能直接丢弃旧网格却仍宣称外观等价。
5. 声音通过玩家当前衣装与事件类别路由到游戏原生事件，剧情和原衣装直通；音频本体不出游戏目录。
6. 构建及安装工具只接受已完成来源核对的公开代码/明确许可依赖。无法替换且没有许可依据的内容保持阻断，不混入发布包。

## 许可依据

PBZModLoader `v1.0.4/LICENSE` 是 GNU GPL version 3 文本：[固定版本文件](https://github.com/zoneoflkf/PBZModLoader/blob/v1.0.4/LICENSE)。工具链有各自许可。计划让用户从上游获取相应版本，保留来源与通知；本项目 MIT 不覆盖加载器。

地图标记已不在交付范围。另一款检索到的 PBZzzzSkinManager 也不采用、不引入：它明确是 source-available，不能把公开可读误当成开放许可。

## English summary

The map-marker mod and UE4SS are excluded. The remaining 812-file ZIP is a private reference, not a cleared public release. Container inspection found copied/modified meshes and audio as well as inherited animation graphs. Referencing the user's native game assets solves asset bundling only; it does not automatically clear inherited code rights.

The intended replacement will load native assets locally and use separately implemented wardrobe registration, retargeting, voice routing, material protection, and portraits. Initial independent FK calculations have been tested offline. [Title-only API checks](NATIVE-API-RESULTS.md) now show that the tested runtime registration calls do not work in the current build; an alternative remains necessary. Visual/gameplay validation is still required. No ready-to-install native-only replacement for all 68 outfits is claimed at this stage.
