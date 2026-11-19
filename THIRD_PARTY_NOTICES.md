# Third-party acknowledgements / 第三方致谢

## PBZModLoader — retained runtime dependency / 保留的运行依赖

This project uses **PBZModLoader**, maintained by **[zoneoflkf](https://github.com/zoneoflkf)**. The loader is their work; this project does not claim authorship or endorsement by its maintainer.

本工程继续使用 **zoneoflkf 维护的 PBZModLoader**，感谢其提供脚本加载与开发支持。加载器并非本工程原创；引用不表示上游作者为本工程背书。

- Upstream source / 上游源码: <https://github.com/zoneoflkf/PBZModLoader>
- Pinned release / 固定版本: [v1.0.4](https://github.com/zoneoflkf/PBZModLoader/releases/tag/v1.0.4)
- License / 许可证: [GNU GPL version 3 text at v1.0.4](https://github.com/zoneoflkf/PBZModLoader/blob/v1.0.4/LICENSE)
- Source for this release / 此版本源码: <https://github.com/zoneoflkf/PBZModLoader/tree/v1.0.4>
- Release download and SHA-256 / 下载与校验: [`profiles/loader-dependency.json`](profiles/loader-dependency.json)

The project retains the upstream loader as an external, unmodified dependency. Obtain its player ZIP directly from the upstream release. Keep the upstream package's notices and dependency licenses. This repository's MIT license does not relicense PBZModLoader, its SDK, or its bundled toolchain. Rehosting or modifying the loader requires satisfying its own license, including applicable corresponding-source obligations; attribution alone is not a substitute.

加载器作为独立、未修改的外部依赖保留，玩家主包从上游发布页取得，保留其中的通知和工具链许可。本仓库 MIT 许可不会覆盖或改变加载器、SDK 与工具链的许可。以后若另行托管或修改加载器，应履行其许可证要求，包括适用的对应源码提供义务；仅写致谢不能代替这些要求。

## Character implementation / 角色实现

The recorded private baseline includes adaptations derived from pre-existing character mods. Those scripts and animation graphs are not granted a new license by this notice. The public replacement is being implemented separately; it must not copy the inherited implementation or publish renamed versions of its assets. Native character models, textures, cloth, groom and audio are loaded from each player's own game.

历史私人基线含有沿用其他角色 MOD 的适配脚本和动画图，本说明不授予这些内容新的许可。公开替代实现独立编写，不通过改名或复制旧动画图完成。官方模型、贴图、衣料、毛发与声音使用玩家自己的游戏资源。

The deployment project and the separately published authoring Skill remain independent projects. Map Collectible Markers and UE4SS are excluded from this wardrobe distribution.
