[English](README.en.md) · **中文**

<div align="center">

# 🗺️ Skills Atlas

**按功能分类的 AI Agent Skills 全景**
不再问"有什么 skill"，而是"我要做 X 该用哪个 skill"。

[![Skills](https://img.shields.io/badge/skills-369-blue)](data/skills.yaml)
[![Repos](https://img.shields.io/badge/repositories-61-green)](data/repositories.yaml)
[![Categories](https://img.shields.io/badge/categories-13_×_74-orange)](data/categories.yaml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[**🌐 在线访问**](https://zita-go.github.io/Skills-Atlas/) · [📦 数据下载](data/) · [🤝 贡献新 skill](CONTRIBUTING.md) · [💬 讨论区](../../discussions)

</div>

---

## 为什么有这个项目

AI Agent Skills 生态在 2025 年爆发，但分散在 ~61 个 GitHub 仓库里。
现有的 awesome 列表只列名字 + 一句话描述，**不知道哪几个能配合用**。

**Skills Atlas** 按"功能维度"重新组织：
- 你想做 SEO？直接看 § 4.1，跨仓库的 6 个 SEO skill 一起呈现
- 你想做完整的开发工作流？看 § 1.1，⛓ 强绑定标记会告诉你哪 5 个必须串起来用
- 你想找文档处理工具？看 § 2.1，Office 4 件套 + PDF 重型 API + 多格式抽取引擎一目了然

## 数据规模

| 维度 | 数量 |
|---|---:|
| 独立 skill | 369 |
| 功能分组 | 185 |
| 大类 / 子分组 | 13 / 74 |
| 源仓库 | 61 |
| ⛓ 强绑定工作流 | 18 |

## 怎么用

### 在线访问
👉 [打开网站](https://zita-go.github.io/Skills-Atlas/)

### 离线（单文件 HTML）
```bash
git clone https://github.com/Zita-Go/Skills-Atlas.git
cd skills-atlas/docs
python3 -m http.server 8000
# 访问 http://localhost:8000
```

或者直接双击 `docs/index.html` 用浏览器打开。

### 当数据源用
```python
import yaml
skills = yaml.safe_load(open('data/skills.yaml'))
repos = yaml.safe_load(open('data/repositories.yaml'))

# 找所有强绑定 ⛓ 工作流
chains = [s for s in skills if s['chain']]
print(f'{len(chains)} chain workflows')
```

JSON 版本在 `docs/data.json`，给前端 / MCP server / API 消费。

## 项目结构

```
skills-atlas/
├── docs/                    # GitHub Pages 部署目录
│   ├── index.html           # 🌟 单文件网站
│   └── data.json            # 给前端 fetch 的结构化数据
├── data/                    # 源数据（贡献者主要改这里）
│   ├── categories.yaml      # 13 大类 / 74 子分组
│   ├── skills.yaml          # 185 个 skill 分组
│   └── repositories.yaml    # 61 个源仓库元数据
├── scripts/                 # 数据处理脚本
│   ├── parse_md.py          # md → yaml（首次迁移用）
│   ├── gen_html.py          # yaml → html（修改 yaml 后重新生成）
│   ├── validate.py          # 校验 yaml 完整性
│   ├── fetch_metadata.py    # 同步 GitHub star（CI 用）
│   └── templates/
│       └── index.html.tmpl  # HTML 模板
├── docs-md/                 # 原始 md 文档（archive）
└── .github/                 # CI / Issue / PR 模板
```

## 自动发现流水线

每天扫 GitHub Search，把新出现的 skill 仓库挂候选清单，让维护者人审入库。

```
.github/workflows/daily-discover.yml   # 每天 UTC 02:00 跑
  └─ scripts/discover_candidates.py    # GitHub Search × N 条 → 跟主库 diff
       ↓
     data/_inbox/raw/YYYY-MM-DD.json   # 当日候选（自动 PR）
       ↓
     scripts/render_candidate_issue.py # 渲染成 Issue body
       ↓
     gh issue create --label discover-bot   # 人审入口
```

人审决定哪些进 `data/repositories.yaml` + `data/skills.yaml`。**LLM 不会自动写入主数据**。

| 阶段 | 状态 | 内容 |
|---|---|---|
| **PR-1** | ✅ 已交付 | 纯发现 + Issue 输出（无 LLM） |
| **PR-2** | 规划中 | OpenRouter 廉价模型做 is-skill-repo 过滤 |
| **PR-3** | 规划中 | GPT-5.5 给候选起 type / 分类 / 中文描述草稿 |

被 PR-1 拒掉的仓库可以追加进 `data/_inbox/blocklist.yaml`，下一次发现自动跳过。

手动触发：
```bash
GITHUB_TOKEN=ghp_xxx python3 scripts/discover_candidates.py
python3 scripts/render_candidate_issue.py --out /tmp/issue.md
```

## 主要功能

- **左侧导航** 13 大类可折叠展开 / 74 子分组直跳
- **实时搜索** 支持 skill 名 / 描述 / 仓库 / 分组名全文搜
- **3 种过滤** 全部 / ⛓ 强绑定 / 多源 / 单 skill
- **暗 / 亮主题** 一键切换 + 记住偏好
- **响应式设计** 移动端自动收侧边栏
- **轻量** 仅字体走 jsdelivr CDN（含系统字体兜底），数据与脚本零运行时依赖

## 贡献

欢迎贡献新 skill / 修复源仓库错误 / 改进描述 / 增加翻译。

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

### 加一个新 skill 四步

1. 编辑 `data/skills.yaml` 加一条
2. 跑 `python3 scripts/validate.py` 校验
3. 跑 `python3 scripts/gen_html.py` 重新生成网站
4. 提 PR

## 相关项目 / 灵感来源

本项目的 skill 数据源自下列优秀仓库（以下仅列贡献最多的几个，完整列表见 `data/repositories.yaml`）：

- [obra/superpowers](https://github.com/obra/superpowers) - Claude Code 软件开发方法论
- [phuryn/pm-skills](https://github.com/phuryn/pm-skills) - 65 个 PM skill
- [openai/skills](https://github.com/openai/skills) - OpenAI Codex 41 skill
- [anthropics/skills](https://github.com/anthropics/skills) - Anthropic 17 skill
- [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) - 41 个营销 skill
- [deanpeters/Product-Manager-Skills](https://github.com/deanpeters/Product-Manager-Skills) - 47 个 PM skill
- [muratcankoylan/Agent-Skills-for-Context-Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) - 15 个 Context Engineering skill

## License

[MIT](LICENSE) — 代码 / 数据 / 内容统一采用 MIT。你可以随便用、随便改、随便商业化，只要保留 attribution。

> 注意：本项目里收录的 skill 元数据 / 描述是我们整理的；但这些 skill 的真实 SKILL.md 内容仍在各自原仓库（见 `data/repositories.yaml`），各自遵循各自的 license。

## 维护者

由社区共同维护。本项目脱胎于一份内部资料整理工作；欢迎所有 skill 作者来 PR 完善自己仓库的描述。
