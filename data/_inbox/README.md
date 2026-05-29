# 自动发现流水线（Inbox）

> 给 daily-discover 工作流用的工作目录。**`raw/` 子目录由 CI 自动写入，不要手工编辑。**
> 后续 PR-2/PR-3 会再加 `filtered/` 和 `proposed/` 子目录。

## 目录约定

```
data/_inbox/
├── README.md              # 本说明
├── blocklist.yaml         # 人审拒绝过的仓库；不再被流水线推荐
├── raw/                   # Stage 1 输出：原始候选（按日，自动生成）
│   └── 2026-05-17.json
├── filtered/              # （PR-2）Stage 2 LLM 过滤结果
└── proposed/              # （PR-3）Stage 3 LLM 草拟入库 patch
```

## blocklist 用法

人工审到不想再看到的候选（私人 dotfiles / 名字带 skill 但内容无关 / fork 链等），
在 `blocklist.yaml` 追加一条即可，下一次 daily-discover 会跳过它：

```yaml
- author: someone
  repo: my-dotfiles
  reason: 不是公开 skill 仓库，是个人配置
  added_at: 2026-05-17
```

`reason` / `added_at` 仅用于人类可读，脚本只用 `(author, repo)` 做匹配，大小写不敏感。

## 入库节奏

- `raw/YYYY-MM-DD.json` 每天早晨 02:00 UTC 由 `daily-discover.yml` 自动写入并提 PR
- 每个工作日的人审看一眼 PR 描述里的候选清单，挑出有价值的提进主库
- 主库（`data/repositories.yaml` + `data/skills.yaml`）的 PR 是手工的，
  因为分类 / 描述 / ⛓ 强绑定判断必须人来拍板
