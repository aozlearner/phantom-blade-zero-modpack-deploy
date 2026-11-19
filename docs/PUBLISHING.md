# 发布这个工程

准备上传的内容是此仓库中的 Python 部署代码、固定清单、元数据、文档、MIT 许可、离线测试和 GitHub Actions。仓库不依赖 Skill，也不包含其副本。

发布前执行：

```powershell
python -m unittest discover -s tests -v
git status --short
git ls-files
```

检查跟踪清单中没有 ZIP、模型、音频、DLL、EXE、存档、日志、用户目录、认证信息和私人备份。`.gitignore` 不是对强制添加文件的授权；不要 `git add -f` 这些内容。

在 GitHub 创建公开空仓库后，把它添加为 `origin` 并推送 `main`。公开资源包是另一项决定，不能把源码公开许可当作第三方资源再分发许可。当前 `profiles/bundle.json` 的下载地址为 null，README 明确标示完整安装需要单独提供资源包。只有在资源可公开提供且来源/许可已核对后，才更新资源获取说明。

如果只共享私有工程，可保持仓库私有，并通过用户认可的独立渠道提供资源包；存档与备份仍不应上传。
