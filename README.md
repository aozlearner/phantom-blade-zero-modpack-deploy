# Phantom Blade Zero Modpack Deploy

**影之刃零 / 影之刃0 MOD 安装、备份与回滚工程**

[English](README.en.md) · [Agent 操作手册](docs/AGENT_RUNBOOK.md) · [MIT License](LICENSE)

Manifest-locked installation, backup, verification, and rollback for a recorded Phantom Blade Zero (PBZ / ProjectPBZ) wardrobe modpack.

《影之刃零》当前 MOD 组合的独立安装工程。将已验证的文件版本、衣柜清单、安装、备份、核验和回滚交给另一个 Agent 或用户执行。**这是普通 Python 项目，完全不依赖任何 Skill、特定 Agent 平台或原作者机器上的目录。**

当前基线：Steam `4115450` / build `26367565`，游戏标题版本 `302256-17280`，2026-11-19，**68 个独立衣柜条目、812 个部署文件**。包含 PBZModLoader、角色外观、战斗语音、头发材质保护和缩略图；地图标记与 UE4SS 已从候选基线排除。

这是卸载前导出的历史组合基线；维护者本机之后已将 MOD 全部备份并卸载。仓库清单保留该组合以供复现，不表示本机现在仍安装这些 MOD。812 是部署文件数量，不是 MOD 数量。

## 公开资源整理状态

正在进行[逐文件来源审计](profiles/distribution-audit.json)。当前 812 文件 ZIP 仍是私人参考快照，**尚不能作为公开完整资源包发布**。白赤练/玉妖派生网格、声音副本和继承的动画适配需要替换；仅改为本地资源路径不能自动解决代码许可。

**已确定的实现边界：继续使用 [zoneoflkf 的 PBZModLoader](https://github.com/zoneoflkf/PBZModLoader)，独立重写继承的角色脚本和动画适配。** 加载器作为未修改的上游依赖保留，固定版本与 SHA-256 见 [依赖记录](profiles/loader-dependency.json)，作者、源码及 GPL 许可说明见 [第三方致谢](THIRD_PARTY_NOTICES.md)。此前失败的是游戏衣柜写表 API 的候选调用，不是 PBZModLoader 加载失败；它不会改变保留该加载器的决定。

**我们自己写的旧实现可以继续沿用，不做全量重写。** 已原样保留头发保护源码并通过当前 68 项衣装的离线回归检查，52 项角色的原生资源路径和装配参数已整理为配置。其他模块逐项区分原创、继承与混合部分，详见[复用与替换计划](docs/REUSE-PLAN.md)。这些进展尚不构成完整可安装的新 MOD 包。

## 先了解资源要求

仓库提供 MIT 许可的**安装工具、锁定清单和文档**，不包含游戏模型、音频、第三方 MOD 二进制、玩家存档或日志。完整资源包须单独取得；目前定制组合没有公开下载地址。**只克隆仓库还不能安装完整组合，也不能仅下载几个上游原版来替代定制资源包。**

维护者可以从与锁定清单一致的参考安装导出资源包，再按各资源的授权条件向使用者提供。取得同一资源包的 Agent 可以直接复现，无需原机器或任何 Skill。上游入口和分发边界见 [资源来源](docs/SOURCES.md)。本项目是当前状态的部署工程，不是从裸游戏源码重新制作所有角色的编译器。

## 使用

需要 Windows、Python 3.10+、对应版本的 Steam 游戏、匹配本清单的 ZIP 资源包。Python 无第三方运行依赖。以下命令都在克隆后的仓库根目录执行；将示例路径替换为自己的路径，备份目录放在游戏目录和 Git 仓库之外。

1. 核验资源包：

   ```powershell
   python -m pbzpack check-bundle --bundle "D:\ModResources\pbz-wardrobe-baseline.zip"
   ```

2. 检查安装计划（只读，游戏运行时也可查看）：

   ```powershell
   python -m pbzpack plan --game "D:\SteamLibrary\steamapps\common\PBZ" --state-dir "D:\PBZ-Private-Backups"
   ```

   `conflicts` 必须为空。已有其他版本或未知 MOD 时，请先备份并单独处理冲突，工具没有强制覆盖开关。识别范围是两个 MOD 根目录、UE4SS Mods 和常用代理 DLL；这不等于验证所有可能的游戏修改。

3. 切到原版或保留的正常衣装，保存并退出游戏。安装期间保持关闭：

   ```powershell
   python -m pbzpack install --game "D:\SteamLibrary\steamapps\common\PBZ" --bundle "D:\ModResources\pbz-wardrobe-baseline.zip" --state-dir "D:\PBZ-Private-Backups"
   ```

   工具检查真实 Windows 进程，核验资源包，备份当前受管理 MOD 文件和存档后写入。Steam 用户数据优先通过注册表定位，失败时明确提供 `--steam-userdata "C:\Program Files (x86)\Steam\userdata"`。安装结果中的 `transaction` 是本次回滚编号，保存它。

4. 核验安装结果：

   ```powershell
   python -m pbzpack verify --game "D:\SteamLibrary\steamapps\common\PBZ"
   ```

   `matched: 812` 且 `problems: []` 表示部署文件完全匹配。之后由玩家启动游戏，按 [验证步骤](docs/VALIDATION.md) 试穿。工具不会启动游戏、加载存档或自动进行游戏测试。

## 回滚

先保存并退出游戏，再使用安装返回的编号：

```powershell
python -m pbzpack rollback --game "D:\SteamLibrary\steamapps\common\PBZ" --state-dir "D:\PBZ-Private-Backups" --transaction "transactions/这里换成实际的32位编号"
```

回到这次安装前的 MOD 文件状态。安装前已经存在且内容一致的文件会保留。回滚不会恢复或删除存档，避免抹掉后续游戏进度。若 MOD 文件后来被用户修改，工具会拒绝覆盖。多次安装按从新到旧的顺序回滚。

写入失败时，备份与 `receipt.json` 会保留，状态为 `failed`。先关闭游戏，处理磁盘/权限问题，再对该编号执行 `rollback`。未完成的事务会阻止后续安装。突然断电留下 `operation.lock` 时，先确认没有本工具进程仍在执行，再移走该锁文件并恢复事务；不要直接删除备份。

## 导出当前组合

只有文件已经与清单一致的参考安装才能导出：

```powershell
python -m pbzpack export --game "D:\SteamLibrary\steamapps\common\PBZ" --bundle "D:\ModResources\pbz-wardrobe-baseline.zip"
```

导出只读取清单内文件，创建 ZIP 后逐个验证解压内容哈希。已有目标文件不会被覆盖。排除存档、运行日志、地图追踪缓存、加载器生成缓存、诊断输出及历史备份。地图标记及其加载器不再属于本组合。

## 项目内容

| 路径 | 用途 |
| --- | --- |
| `pbzpack/` | 命令行、清单校验、事务安装和回滚 |
| `profiles/current.lock.json` | 812 个文件的路径、大小、SHA-256 与游戏版本 |
| `profiles/outfits.json` | 68 个衣柜 ID、名称与提供模块 |
| `docs/AGENT_RUNBOOK.md` | 任意 Agent 的执行流程 |
| `docs/ARCHITECTURE.md` | 动作、语音、材质、冲突与缩略图的安装约束 |
| `docs/VALIDATION.md` | 已做验证与游戏内检查边界 |
| `docs/SOURCES.md` | 来源、资源获取和授权边界 |
| `tests/` | 使用虚拟游戏目录的离线回归测试 |

开发验证：`python -m unittest discover -s tests -v`。GitHub Actions 配置 Windows/Linux；Linux 仅测试离线逻辑，真实游戏安装仅支持 Windows。

MIT 许可仅涵盖本仓库原创部署代码和文档，不改变游戏及第三方 MOD 的许可。

角色制作方法单独发布于 [Phantom Blade Zero Wardrobe Skill](https://github.com/aozlearner/phantom-blade-zero-wardrobe-skill)。两仓库互不依赖，本工程无需安装 Skill。社区项目，与游戏开发商或发行商无隶属关系。
