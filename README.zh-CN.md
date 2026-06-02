[English](README.md) | **中文**

<div align="center">

# 🗺️ Skills Atlas

**按功能分类的 AI Agent Skills 全景**
不再问"有什么 skill"，而是"我要做 X 该用哪个 skill"。

[![Skills](https://img.shields.io/badge/skills-906-blue)](data/skills.yaml)
[![Repos](https://img.shields.io/badge/repositories-115-green)](data/repositories.yaml)
[![Categories](https://img.shields.io/badge/categories-20_×_116-orange)](data/categories.yaml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[**🧩 Claude Code 插件**](packages/skills-atlas-cli/plugin) | [**⌨️ CLI**](packages/skills-atlas-cli) | [🌐 在线访问](https://zita-go.github.io/Skills-Atlas/?lang=zh) | [📦 数据下载](data/) | [🤝 贡献新 skill](CONTRIBUTING.zh-CN.md) | [💬 讨论区](../../discussions)

</div>

---

## 快速上手

**skill** 是一个可复用的 `SKILL.md` 指令包，教 Claude Code 一套专门工作流：系统化调试、
事前复盘（pre-mortem）、SEO 审计、PDF 翻译，等等几百种。**Skills Atlas** 精选了 800+ 个这类 skill。

**最省事的用法是 Claude Code 插件** 🧩 —— 在对话里直接发现、安装、甚至**孵化**新 skill，
还自带一个**默认开启的自动驾驶**：你干活时，Claude 主动把合适的 skill 递到面前，不用搜。

```text
npm i -g skills-atlas-cli                      # 引擎(Node 18+)
/plugin marketplace add Zita-Go/Skills-Atlas   # 然后在 Claude Code 里:
/plugin install skills-atlas@skills-atlas
```

重启 Claude Code，然后直接说你要做什么，剩下交给 Skills Atlas。随时 `/skills-atlas:setup`
看你装了什么。→ [**插件文档**](packages/skills-atlas-cli/plugin)

**更喜欢终端？** 同样的能力也是一个独立 CLI：

```bash
npm install -g skills-atlas-cli
skills-atlas search "stress test my launch plan"   # pre-mortem 排在最前
skills-atlas use pre-mortem                          # 装上,Claude 立即用上
```

完整文档：[**🧩 Claude Code 插件**](packages/skills-atlas-cli/plugin)（推荐），或独立的 [**⌨️ `skills-atlas-cli`**](packages/skills-atlas-cli)。

## 为什么有这个项目

AI Agent Skills 生态在 2025 年爆发，但分散在 ~115 个 GitHub 仓库里。
现有的 awesome 列表只列名字 + 一句话描述，**不知道哪几个能配合用**。

**Skills Atlas** 按"功能维度"重新组织：
- 你想做 SEO？直接看 § 4.1，跨仓库的 6 个 SEO skill 一起呈现
- 你想做完整的开发工作流？看 § 1.1，⛓ 强绑定标记会告诉你哪 5 个必须串起来用
- 你想找文档处理工具？看 § 2.1，Office 4 件套 + PDF 重型 API + 多格式抽取引擎一目了然

而且它不只是一个用来看的目录：一个[Claude Code 插件 + 终端 CLI](packages/skills-atlas-cli/plugin)让你直接
**搜索、安装、使用**这些 skill，还带一个自动驾驶（插件里默认开启），在你工作时主动把合适的 skill 递到你面前。

## 数据规模

| 维度 | 数量 |
|---|---:|
| 独立 skill | 906 |
| 功能分组 | 297 |
| 大类 / 子分组 | 20 / 116 |
| 源仓库 | 115 |
| ⛓ 强绑定工作流 | 20 |

覆盖 **20 个功能大类**，从软件工程、产品、营销、设计，到 **法律、医疗、金融、DevOps/SRE、安全、教育、Web3** 等专业垂直领域。

## 怎么用

### 🧩 在 Claude Code 里 —— 插件（推荐）

最顺手的方式：装上插件，让 Skills Atlas **在对话里**干活 —— 不用切到终端。它的**自动驾驶默认开启**，
你干活时 Claude 主动端出合适的 skill；其余的交给斜杠命令。

<a href="packages/skills-atlas-cli/plugin"><img src="docs/plugin-demo.png" alt="Skills Atlas 插件——autopilot 在对话里主动端出合适的 skill" width="820"></a>

```text
npm i -g skills-atlas-cli                      # 引擎(Node 18+)
/plugin marketplace add Zita-Go/Skills-Atlas   # 然后在 Claude Code 里:
/plugin install skills-atlas@skills-atlas
```

重启 Claude Code（或 `/reload-plugins`），先跑 **`/skills-atlas:setup`**。之后直接说需求，或用命令：

| 命令 | 作用 |
|---|---|
| `/skills-atlas:skill-search <query>` | 在目录里找 skill |
| `/skills-atlas:skill-install <skill>` | 装上并在本项目激活 |
| `/skills-atlas:skill-kit` | 识别项目类型，配一套对口 skill |
| `/skills-atlas:skill-craft` | 把你反复做的工作流孵化成新 skill |
| `/skills-atlas:skill-gaps` | 推荐你常做、却还没装的 skill |
| `/skills-atlas:skill-prune` | 标出已装但用不上的 skill |
| `/skills-atlas:skill-autopilot [on\|off]` | 开关 / 微调自动驾驶 |

→ [**插件完整文档**](packages/skills-atlas-cli/plugin)

### ⌨️ 或者从终端（CLI）

[`skills-atlas-cli`](packages/skills-atlas-cli) 也是个独立工具 —— 插件跑的就是它这套引擎。
在终端里直接搜索、**安装**、使用 skill：

<a href="packages/skills-atlas-cli"><img src="docs/cli-demo.png" alt="skills-atlas：搜索 → 查看 → 安装一个 skill" width="760"></a>

```bash
npx skills-atlas-cli search seo
npx skills-atlas-cli info brainstorming
npx skills-atlas-cli install brainstorming --global   # → ~/.claude/skills/brainstorming/
```

`install` **只下载那一个 skill 的文件夹**（不是整个仓库）到 `.claude/skills/`。这个 CLI 已经长成一整套工具：

- **包管理器。** `use`（装上并立即激活）、`installed`、`outdated`、`upgrade`、`remove`、`doctor`。
- **项目套件。** `kit` 识别你的项目（前端 / 后端 / 数据 / 基础设施）装一整套对口 skill；`sync` 从可提交的 `skills-atlas.kit.json` 复现。
- **私有源。** `registry add <你的 data.json>` 把组织内部 skill 合并进搜索 / 安装（同名私有优先）。
- **Claude Code 里。** 附带[插件](packages/skills-atlas-cli/plugin)（`/skills-atlas:skill-search` / `:skill-install`）。
- **任意 MCP 客户端。** `skills-atlas mcp` 起一个 MCP server（search / info / install / categories），给 Claude Desktop 等 agent 用。

**skill 装到哪儿：** 你自己敲 `install` / `use` → **全局**（`~/.claude/skills/`，处处可用）；autopilot、插件、`kit` 装的 → **这个项目**（`./.claude/skills/`，可提交给队友）。随时用 `--global` / `--project` 覆盖。

→ [CLI 完整文档](packages/skills-atlas-cli)

### 🤖 自动驾驶：让合适的 skill 主动找你

你不该为了用上一个 skill，得先知道它存在。**用插件的话，自动驾驶默认就开着** —— 只要任务命中某个你还没装的
skill，Claude 就会主动端出来、讲清楚为什么，一条命令就用上：

> 🗣️ *"上线前先做个 pre-mortem 把风险过一遍"*
>
> 🤖 *"这正是 **pre-mortem** 这个 skill 的拿手活：上线前把计划的失败模式压测一遍。**现在就用**，看看细节，还是跳过？"*

逐条建议在本地匹配（prompt 不外传），绝不自动安装。（用独立 CLI？用 `skills-atlas hook on` 打开。）
可配回复语言等 —— [它怎么工作 →](packages/skills-atlas-cli/plugin)

**🔭 能力缺口 & 🧹 清理。** `skills-atlas gaps` 读你**最近的活动**（Claude Code 本地的 transcript），由一个**后台子 agent**——你选的小模型（`hook model`，默认 Haiku，复用你的 Claude Code 登录）——发现"你反复在做、却没装对应 skill"的那类活并推荐；它会把最近的 prompt 交给那个模型判断（同你已在用的 Claude Code 同一家）。`skills-atlas prune` 反向：把你用不上的已装 skill 挑出来建议删。[详情 →](packages/skills-atlas-cli)

### 在线访问
👉 [打开网站](https://zita-go.github.io/Skills-Atlas/?lang=zh)

## 贡献

欢迎贡献新 skill、修复、改进描述、翻译。详见 **[CONTRIBUTING.zh-CN.md](CONTRIBUTING.zh-CN.md)**。

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

[MIT](LICENSE)。代码 / 数据 / 内容统一采用 MIT。你可以随便用、随便改、随便商业化，只要保留 attribution。

> 注意：本项目里收录的 skill 元数据 / 描述是我们整理的；但这些 skill 的真实 SKILL.md 内容仍在各自原仓库（见 `data/repositories.yaml`），各自遵循各自的 license。

## 维护者

由社区共同维护。本项目脱胎于一份内部资料整理工作；欢迎所有 skill 作者来 PR 完善自己仓库的描述。
