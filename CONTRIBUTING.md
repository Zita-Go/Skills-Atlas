# 贡献指南

感谢想为 Skills Atlas 做贡献！这里是几种最常见的贡献方式。

## TL;DR

1. **加新 skill / 改描述** → 编辑 `data/skills.yaml`，跑 `python3 scripts/validate.py`，提 PR
2. **加新源仓库** → 同时编辑 `data/repositories.yaml`
3. **报告失效链接 / 错误归类** → 提 issue 用对应模板

## 加一个新 skill

### Step 1: 找到正确的 category 和 subcategory

打开 `data/categories.yaml` 看 13 大类 / 74 子分组，找到最贴近的归属。

如果觉得没有合适的子分组，**优先**先在现有 category 下加新 subcategory，少新增大类。

### Step 2: 在 `data/skills.yaml` 加一条

```yaml
- id: <category>--<subcategory>--<3-digit-counter>
  skills:
    - <skill-name>          # 可以多个 + 表示这一组合并使用
  group: 这一组的中文名
  category: <category-id>
  subcategory: <subcategory-id>
  chain: false              # true 表示这一组必须串起来用
  description: 一句话功能描述。可以含中英文混排。
  sources:
    - <vendor-id>           # 必须在 repositories.yaml 里有定义
```

`id` 用 `python3 scripts/parse_md.py` 重新生成 md 时会自动按顺序排号；
但你直接改 yaml 时也可以用任意有意义的字符串（保证全局唯一即可）。

### Step 3: 如果 source 是新仓库，加到 `data/repositories.yaml`

```yaml
- id: <vendor-id>           # skills.yaml 里 sources 用的就是这个 id
  author: github-owner
  repo: github-repo-name
  url: https://github.com/owner/repo
  type: skill               # 见下方 type 列表
  skill_group_count: 1      # 该仓库贡献的 group 数（不影响校验）
```

`type` 可选值：

| type | 说明 |
|---|---|
| `skill` | 单 skill 仓库（一个 SKILL.md） |
| `skill-pack` | 多 skill 仓库（多个 SKILL.md） |
| `plugin` | Claude Code plugin（不是 skill，比如带 hook） |
| `cli` | CLI 工具，可能附带 skill 入口 |
| `cli-framework` | 工作流框架（如 OpenSpec） |
| `cli-mcp` | CLI + MCP server 混合（如 claude-mem） |
| `python-library` | Python 库（如 notebooklm-py） |
| `desktop-app` | 桌面应用（如 Dorothy） |
| `multi-skill-suite` | 多 skill 套件（带运行时） |
| `marketplace` | Plugin marketplace |
| `claude-md-template` | 只是 CLAUDE.md 模板，不是真 skill |
| `extraction-engine` | 内核工具（如 kreuzberg） |
| `video-engine` | 视频引擎（如 OpenMontage） |
| `sdd-framework` | Spec-Driven Development 框架 |

### Step 4: 校验 + 重新生成 HTML

```bash
python3 scripts/validate.py     # 必须显示 "All checks passed"
python3 scripts/gen_html.py     # 重新生成 docs/index.html + docs/data.json
```

### Step 5: 提 PR

PR 标题格式：`feat: add <skill-name> from <vendor>`
PR 描述简单写一下来源 + 为什么归到这个分类即可。

## 加一个 ⛓ 强绑定工作流

如果你发现一组 skill **必须组合使用**才发挥作用（比如 Figma 8 件套、文案三件套），把这一组合并成 1 个 group：

```yaml
- skills:
    - figma
    - figma-use
    - figma-create-new-file
    - figma-generate-design
    # ...
  chain: true              # 关键：标记为强绑定
  group: Figma 8 件套
  description: 8 个 figma skill 必须串成完整生态：figma 是总入口...
```

## 改 13 大类 / 74 子分组结构

需要谨慎，因为会影响所有 skill 的 category / subcategory 字段。

如果你认为现有分类不合理，先开 issue 讨论，再做大改动。

## 翻译

目前网站 / yaml 主要是中文。如果想做英文版：

1. 在 `data/skills.yaml` 加一个 `description_en` 字段（同上结构）
2. 在 `data/categories.yaml` 加 `title_en` / `subtitle_en`
3. 改 `scripts/templates/index.html.tmpl` 加语言切换器

我们会逐步完善 i18n 支持。

## 报告问题

| 问题类型 | 用什么 |
|---|---|
| 链接失效 | issue → "fix-source" 模板 |
| 描述错误 / 归类错误 | issue → "fix-description" 模板 |
| 加新 skill | PR 直接改 yaml；或 issue → "add-skill" 模板 |
| 功能建议 | issue → "feature-request" 模板 |

## Code of Conduct

参与本项目即视为同意 [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md)。

简短版：对所有人友好。批评对事不对人。不容忍歧视、骚扰、人身攻击。
