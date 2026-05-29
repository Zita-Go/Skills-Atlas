# Skills 按功能分类

> 不再按仓库来源切分，按"做什么事"重新归类。同一功能下来自不同仓库的 skill 仍然合并描述；仓库内必须串起来用的组合保留 ⛓ 标记。每行均给完整功能介绍。

## 目录

1. [软件开发与工程](#一软件开发与工程)
2. [文档与知识管理](#二文档与知识管理)
3. [产品管理（PM）](#三产品管理pm)
4. [营销 / 增长 / 销售](#四营销--增长--销售)
5. [设计 / 视觉 / 前端](#五设计--视觉--前端)
6. [媒体生产](#六媒体生产)
7. [数据 / 抓取 / 情报](#七数据--抓取--情报)
8. [求职 / 个人办公](#八求职--个人办公)
9. [通信 / 工具集成](#九通信--工具集成)
10. [创业 / 财务 / 合规](#十创业--财务--合规)
11. [学术 / 科研 / 长跑研究](#十一学术--科研--长跑研究)
12. [Agent 架构 / Context Engineering](#十二agent-架构--context-engineering)
13. [元能力 / Skill 治理](#十三元能力--skill-治理)

---

## 一、软件开发与工程

### 1.1 计划 / SDD（Spec-Driven Development）方法论

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| brainstorming + writing-plans + executing-plans + subagent-driven-development + dispatching-parallel-agents | 核心开发工作流（superpowers） ⛓ | brainstorming + writing-plans + executing-plans + subagent-driven-development + dispatching-parallel-agents 五件套：苏格拉底式精炼意图 → 拆 2-5 分钟微任务（每任务给精确文件路径+完整代码+验证）→ 批次执行 + 人工 checkpoint → 每任务派 fresh subagent + 双阶段 review（spec 合规 → 代码质量）→ 并行 subagent 编排 | [superpowers](https://github.com/obra/superpowers) |
| grill-me + pre-mortem + define-goal | 意图澄清 / "逼问"模式 | grill-me（让 Claude 反过来盘问你的计划直到所有决策树压力测试）+ Pawel pre-mortem（"假设它失败了，为什么"）+ Codex define-goal（把模糊意图改写成"具体可验证目标"含 outcome / artifact / verification / scope / stop / 阈值） | [mattpocock](https://github.com/mattpocock/skills) · [Pawel](https://github.com/phuryn/pm-skills) · [Codex](https://github.com/openai/skills) |
| openspec + get-shit-done | 轻量 SDD 框架 | openspec（Fission-AI/OpenSpec：openspec init 把"提议变更 → 评审 → 归档"接入 Claude Code/Cursor/Codex）；get-shit-done（gsd-build：把 meta-prompt + context engineering + SDD 串成统一框架，对标 BMAD/Spec-Kit 但更精简） | [Fission-AI](https://github.com/Fission-AI/OpenSpec) · [gsd-build](https://github.com/gsd-build/get-shit-done) |
| handoff | 会话接力 / 上下文 handoff | mattpocock handoff（把当前会话压成结构化 handoff 文档，让另一个 agent / 另一段会话无缝接力，不再"跟下一个 Claude 解释一遍"） | [mattpocock](https://github.com/mattpocock/skills) |

### 1.2 TDD / 测试 / 调试 / 验证

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| test-driven-development + tdd + test-scenarios | TDD（多家同名版本） | superpowers test-driven-development（最严，强制 RED-GREEN-REFACTOR）+ mattpocock tdd（最轻，单 vertical slice）+ Pawel test-scenarios（从 user story 生成全面测试场景）。三家可选 | [superpowers](https://github.com/obra/superpowers) · [mattpocock](https://github.com/mattpocock/skills) · [Pawel](https://github.com/phuryn/pm-skills) |
| systematic-debugging + diagnose + sentry | 系统化调试 | superpowers systematic-debugging 4 阶段根因（含 root-cause-tracing / defense-in-depth / condition-based-waiting）+ mattpocock diagnose（复现→最小化→假设→注入观测→修→回归测试）+ Codex sentry（看生产 issue + AI 根因 + AI 修复方案，PII 自脱敏） | [superpowers](https://github.com/obra/superpowers) · [mattpocock](https://github.com/mattpocock/skills) · [Codex](https://github.com/openai/skills) |
| verification-before-completion | 完工验证 | superpowers verification-before-completion（"真的修好了吗"完工自检） | [superpowers](https://github.com/obra/superpowers) |
| webapp-testing | Web 应用 UI 测试 ⛓ | Anthropic webapp-testing + ComposioHQ webapp-testing（用 Playwright 测本地 webapp，跨浏览器 Chromium/Firefox/WebKit + 移动模拟 + 截图 + 网络拦截 + console 错误捕获） | [Anthropic](https://github.com/anthropics/skills) · [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) |
| playwright + playwright-interactive | 浏览器自动化 | Codex playwright（终端开真实浏览器，snapshot→click/type/fill）+ playwright-interactive（用 js_repl 维持 Playwright/Electron 持久会话做 UI 迭代调试） | [Codex](https://github.com/openai/skills) |

### 1.3 代码 Review / 重构 / 语义去重

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| requesting-code-review + receiving-code-review | Code Review 双向 ⛓ | superpowers requesting-code-review（提交前清单）+ receiving-code-review（接 review 反馈处理） | [superpowers](https://github.com/obra/superpowers) |
| improve-codebase-architecture + zoom-out | 重构 / 拯救 ball-of-mud | mattpocock improve-codebase-architecture（每几天跑一次找 deepening 机会拯救代码库）+ zoom-out（让 agent 退一步给系统级解释） | [mattpocock](https://github.com/mattpocock/skills) |
| finding-duplicate-functions | 语义代码去重 | superpowers-lab finding-duplicate-functions（Haiku 分类 → Opus 找同意图不同实现） | [superpowers-lab](https://github.com/obra/superpowers-lab) |

### 1.4 Git / PR / CI 协作

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| gh-address-comments + gh-fix-ci + yeet | GitHub 三件套 ⛓ | Codex gh-address-comments（拉 PR review thread 编号让用户挑哪些要修）+ gh-fix-ci（定位失败的 GitHub Actions 检查抓 run/job 日志先出 plan 再改）+ yeet（一气呵成 stage→commit→push→开 draft PR，自动发现 PR 模板填好 title/body） | [Codex](https://github.com/openai/skills) |
| using-git-worktrees + finishing-a-development-branch | Git 工作流 | superpowers using-git-worktrees（在新 branch 创隔离 workspace + 跑 setup + 验证 baseline）+ finishing-a-development-branch（验证完成→选 merge/PR/keep/discard→清理 worktree） | [superpowers](https://github.com/obra/superpowers) |
| claude-code-safety-net | 危险命令拦截 | kenryu42 claude-code-safety-net（plugin 不是 skill）：hook 进 PreToolUse 事件，在 Claude 跑 git push --force / reset --hard / rm -rf / clean -f 等危险命令前拦截等用户确认 | [kenryu42](https://github.com/kenryu42/claude-code-safety-net) |

### 1.5 多平台部署

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| cloudflare-deploy + netlify-deploy + render-deploy + vercel-deploy | 平台特化部署（4 选 1 平行替代） | cloudflare-deploy（Workers/Pages/D1/R2/KV/Queues/AI/Vectorize/WAF 60+ 产品决策树）+ netlify-deploy（npx netlify CLI 自动 link + 智能识 Next/Vite/静态）+ render-deploy（Git-backed + render.yaml Blueprint）+ vercel-deploy（默认 preview，CLI 不可用时降级到 deploy script 拿 previewUrl + claimUrl） | [Codex](https://github.com/openai/skills) |

### 1.6 API / SDK / MCP / Agent 开发

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| claude-api + gemini-api-dev + gemini-live-api-dev + gemini-interactions-api + openai-docs | 三大模型厂 SDK 直连 | Anthropic claude-api（强制 prompt caching + adaptive thinking + 4.5/4.6/4.7 升级）+ Gemini 三件套 ⛓（gemini-api-dev / gemini-live-api-dev WebSocket 实时音视频 / gemini-interactions-api 替代旧 generateContent + 处理 schema breaking change）+ Codex openai-docs（用 developers.openai.com MCP 优先查文档 + 模型选型 + 模型字符串升级） | [Anthropic](https://github.com/anthropics/skills) · [Gemini](https://github.com/google-gemini/gemini-skills) · [Codex](https://github.com/openai/skills) |
| mcp-builder | MCP Server 开发 | Anthropic mcp-builder（四阶段方法论：研究 → 实现 → 测试 → 评估，输出完整 MCP Server 项目 + 10 个 eval QA 对） | [Anthropic](https://github.com/anthropics/skills) |
| chatgpt-apps | OpenAI 平台开发 ⛓ | Codex chatgpt-apps（docs-first 脚手架 ChatGPT Apps SDK：archetype 分类 → tool plan → 选 starter → MCP server + widget UI 骨架；强制要先调 openai-docs） | [Codex](https://github.com/openai/skills) |
| agent-browser | 浏览器 agent CLI | vercel-labs/agent-browser（基于 Chrome DevTools Protocol 的 agent 浏览器自动化 CLI：导航 / 填表 / 点击 / 截图 / 抓数据） | [vercel-labs](https://github.com/vercel-labs/agent-skills) |

### 1.7 .NET / 桌面 / 远端运行环境

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| aspnet-core + winui-app | Microsoft / .NET 栈 ⛓ | aspnet-core（按 .NET 10 / ASP.NET Core 10 当前实践写 Blazor / Razor Pages / MVC / Minimal APIs / Web API + DI + 中间件 + 认证 + SignalR + gRPC）+ winui-app（装/改 WinUI 3 + Windows App SDK 桌面应用，自动跑 WinGet 装 VS 2026 + dotnet new winui） | [Codex](https://github.com/openai/skills) |
| windows-vm | Windows VM in Docker | superpowers-lab windows-vm（headless Win11 in Docker + KVM + SSH，自动装 OpenSSH + Node + Claude Code，让 Claude Code 能跑在 Windows 上） | [superpowers-lab](https://github.com/obra/superpowers-lab) |
| using-tmux-for-interactive-commands | tmux 操控交互 CLI | superpowers-lab using-tmux-for-interactive-commands（agent 进 vim / git rebase -i / menuconfig / REPL 改文件） | [superpowers-lab](https://github.com/obra/superpowers-lab) |

### 1.8 安全审计 / 威胁建模

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| security-best-practices + security-threat-model + security-ownership-map | 应用层安全三件套 | Codex security-best-practices（按语言加载 reference py/js/ts/go 写 secure-by-default 代码）+ security-threat-model（基于仓库证据做 AppSec 级威胁建模：scope → 信任边界 → asset → entry → 攻击者能力 → abuse path → 缓解）+ security-ownership-map（从 git history 建"人 ↔ 文件"二部图算 bus factor / 孤儿敏感代码 / co-change 聚类） | [Codex](https://github.com/openai/skills) |
| skills | 专业级安全 Marketplace | trailofbits/skills（35+ plugin 跨 9 个领域）：智能合约（building-secure-contracts 6 链 + entry-point-analyzer）、代码审计（c-review/differential-review/fp-check/insecure-defaults/semgrep-rule/sharp-edges/static-analysis/supply-chain-risk-auditor/testing-handbook/trailmark/variant-analysis/agentic-actions-auditor/audit-context-building/burpsuite-project-parser/dimensional-analysis）、恶意代码（yara-authoring）、形式化验证（constant-time/mutation/property-based/spec-to-code/zeroize-audit）、逆向（dwarf-expert）、移动（firebase-apk-scanner） | [trailofbits](https://github.com/trailofbits/skills) |
| sentry | 生产监控 | Codex sentry（用 sentry CLI 只读地查 issue / event / health，含 issue explain AI 根因 + issue plan AI 修复方案，输出 PII 自脱敏） | [Codex](https://github.com/openai/skills) |

---

## 二、文档与知识管理

### 2.1 Office 文档处理（Word / PPT / Excel / PDF）

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| docx + pdf + pptx + xlsx | Office 四件套（Anthropic） | docx（Word 读/改/生成含 letterhead/目录/追踪修订/图片）+ pdf（读/抽/合/拆/旋/水印/加密/表单/OCR）+ pptx（读/编辑/创建 + 10 套配色 + 字体规则 + subagent 视觉 QA）+ xlsx（强制金融建模色彩规范：蓝输入/黑公式/绿跨表/红外链） | [Anthropic](https://github.com/anthropics/skills) |
| nutrient-agent-skill | PDF 重型 API | PSPDFKit-labs/nutrient-agent-skill（依赖 Nutrient DWS API）：转换（PDF↔DOCX/XLSX/PPTX/HTML/图）/ assemble（合并/分页/旋转）/ 抽文本+表格 / OCR 20+ 语言 / pattern + AI 双路 PII 脱敏 / 水印 / CMS+CAdES 数字签名 / 表单填充 / PDF/A 合规 / 优化 linearize | [PSPDFKit-labs](https://github.com/PSPDFKit-labs/nutrient-agent-skill) |
| kreuzberg | 多格式抽取引擎 | kreuzberg-dev/kreuzberg：Rust 内核覆盖 90+ 文件格式 + 300+ 编程语言 tree-sitter 代码语义抽取 + 143 个 LLM/VLM provider 做 VLM-OCR + TOON 序列化省 30-50% RAG token；提供 14 语言 binding（Python/Node/Ruby/Java/Go/PHP/Elixir/C#/R/C/Swift/Dart） | [kreuzberg-dev](https://github.com/kreuzberg-dev/kreuzberg) |

### 2.2 长文本翻译 / 跨语言

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| translate-book | 整本书并行翻译 | deusyu/translate-book（PDF/DOCX/EPUB）：Calibre 转 HTMLZ → 切 chunk → 8 路并行 subagent 翻译 → manifest SHA-256 校验 → 增量重译 → Pandoc 合回；带 glossary 实体一致性 + 邻域上下文（前后 ~300 字）解决代词指代 | [deusyu](https://github.com/deusyu/translate-book) |

### 2.3 写作 / 共写 / 文案打磨

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| doc-coauthoring + internal-comms | 协作写文档 | Anthropic doc-coauthoring（"上下文采集 → 迭代结构 → 读者测试"三阶段共写 PRD/RFC/设计文档）+ Anthropic internal-comms（写 3P 进度 / company newsletter / FAQ / leadership update / incident report） | [Anthropic](https://github.com/anthropics/skills) |
| humanizer | 去 AI 味 / 提高自然度 | blader/humanizer（drop 常见 AI 模板词、补节奏变化、提高自然度，让 LLM 输出读起来不像 LLM 写的） | [blader](https://github.com/blader/humanizer) |
| write-concisely | 简洁化改写 | NeoLabHQ/write-concisely（套用 Strunk & White《The Elements of Style》原则：去冗、强动词、被动→主动、改善结构） | [NeoLabHQ](https://github.com/NeoLabHQ/context-engineering-kit) |
| grammar-check + huashu-skills | 语法 / 文风审查 | Pawel grammar-check（找语法/逻辑/流畅度问题给定向修改建议）+ alchaincyf huashu-skills（含 AI 审校 / 选题生成 / 视频脚本拆解 21 内容创作 skill） | [Pawel](https://github.com/phuryn/pm-skills) · [alchaincyf](https://github.com/alchaincyf/huashu-design) |
| readme | README 自动生成 | Shpigford/readme（根据项目结构自动生成 README + 安装 + API 模板 + 贡献指南） | [Shpigford](https://github.com/Shpigford/readme) |
| caveman | 极简输出模式 | JuliusBrussee/caveman + mattpocock caveman（"穴居人模式"把 Claude 输出风格压到极简——drop 所有 filler、保留完整技术准确度，实测可省 ~75% token） | [JuliusBrussee](https://github.com/JuliusBrussee/caveman) · [mattpocock](https://github.com/mattpocock/skills) |
| claude-speed-reader | 速读 Claude 回复 | SeanZoR/claude-speed-reader（用 RSVP 每次显示一个词 + 红色高亮 ORP 最优识别点以 600+ WPM 速读 Claude 上一段回答；空格/←→ 控速） | [SeanZoR](https://github.com/SeanZoR/claude-speed-reader) |

### 2.4 NotebookLM / 知识图谱 / 课程化

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| notebooklm-skill + notebooklm-py | NotebookLM 双路线 | PleasePrompto/notebooklm-skill（Patchright 浏览器自动化登录 + 查询 source-grounded 答案 + 列出/切换 notebook + 持久化 auth）vs teng-lin/notebooklm-py（非官方 NotebookLM Python API 纯 async + 无需 OAuth + 创建 notebook + 上传 source + 查询 + 生成 audio） | [PleasePrompto](https://github.com/PleasePrompto/notebooklm-skill) · [teng-lin](https://github.com/teng-lin/notebooklm-py) |
| graphify | 项目知识图谱 | safishamsi/graphify（/graphify 命令把整个项目的代码 / 文档 / PDF / 图片 / 视频 映射成可查询知识图谱，让 Claude 跨文件推理时不需要每次重新搜） | [safishamsi](https://github.com/safishamsi/graphify) |
| tutor-skills | Obsidian 学习金库 ⛓ | bevibing/tutor-skills（tutor-setup + tutor）：自动检测是 Document 还是 Codebase 模式，把 PDF/MD/HTML/EPUB/源代码 → Obsidian StudyVault（概念笔记 + MOC + 练习题）→ tutor 做 4 题/轮交互式测验 + 记忆薄弱点（🟥🟨🟩🟦⬜）做下一轮 drill | [bevibing](https://github.com/bevibing/tutor-skills) |
| skill-focus | 论文摘要（FOCUS 方法） | stephenturner/skill-focus（用 FOCUS 框架做学术论文摘要：把每篇论文压成"focus / outcome / contribution / underlying / sample"五段式，便于 AI 后续做 cross-paper 综述与跨文献比较） | [stephenturner](https://github.com/stephenturner/skill-focus) |

### 2.5 Notion 协作矩阵

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| notion-knowledge-capture + notion-meeting-intelligence + notion-research-documentation + notion-spec-to-implementation | Notion 4 联工作流 ⛓ | Codex notion-knowledge-capture（对话/笔记按数据库 schema 转结构化页 5 类：决策/how-to/FAQ/wiki/学习记录）+ notion-meeting-intelligence（拉历史 Notion + Codex research 出 agenda 6 模板：状态/决策/计划/retro/1:1/头脑风暴）+ notion-research-documentation（多页交叉调研合成 + 强制 citations，4 模板：quick brief / summary / comparison / comprehensive）+ notion-spec-to-implementation（把 Notion spec 解析成实现计划页 + 任务库条目 + 互相关联）。全部依赖 Notion MCP | [Codex](https://github.com/openai/skills) |
| notion-cookbook | Notion 官方 cookbook | makenotion/notion-cookbook（Notion × Claude MCP 工作流，含自动化文档撰写 / 会议准备 / 研究等） | [makenotion](https://github.com/makenotion/notion-cookbook) |

### 2.6 跨 session 持久记忆

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| claude-memory-skill | 轻量分层记忆 | hanfang/claude-memory-skill（core.md 始终加载存 summary + 指针 → topics/<x>.md 按需加载 → me.md 关于你；写记忆走后台 agent 不阻塞主 agent；纯 grep 检索不用向量库） | [hanfang](https://github.com/hanfang/claude-memory-skill) |
| claude-mem | 影子 agent + MCP 记忆 | thedotmack/claude-mem（spawn 影子 Sonnet 跟随主会话写 observations + 4 个 MCP tool 做 token 高效的 3 层记忆工作流：search → context → recall；mem-search skill 自动 invoke） | [thedotmack](https://github.com/thedotmack/claude-mem) |
| self-improving-agent | 自我精炼 agent | alirezarezvani self-improving-agent（利用 Claude Code v2.1.32+ auto-memory 自动记录的项目模式 / debug 经验 / 纠正历史，做模式提升 + skill 抽取 + 记忆健康检查） | [alirezarezvani](https://github.com/alirezarezvani/claude-skills) |

---

## 三、产品管理（PM）

### 3.1 用户研究 / 客户旅程 / 反馈分析

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| user-personas + user-segmentation + market-segments + ideal-customer-profile + proto-persona | 用户画像 / persona | Pawel user-personas（3 个 persona 含 JTBD + pains + gains）+ user-segmentation（按行为/JTBD/需求切分用户群）+ market-segments（3-5 个客户细分含 product fit）+ ideal-customer-profile（ICP 人口学+行为+JTBD）+ Dean proto-persona（在做完整调研前先建假设型 persona） | [Pawel](https://github.com/phuryn/pm-skills) · [Dean](https://github.com/deanpeters/Product-Manager-Skills) |
| customer-journey-map | 客户旅程图 | Pawel customer-journey-map + Dean customer-journey-map / customer-journey-mapping-workshop（NNGroup 框架画跨触点 journey + 多轮工作坊引导） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) · [Pawel](https://github.com/phuryn/pm-skills) |
| jobs-to-be-done + job-stories | JTBD（Jobs-to-be-Done） | Dean jobs-to-be-done（Christensen + Osterwalder 三栏 + pains/gains）+ Pawel job-stories（when X I want Y so Z 格式 + 验收标准） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) · [Pawel](https://github.com/phuryn/pm-skills) |
| interview-script + summarize-interview + discovery-interview-prep + transcribe | 客户访谈 | Pawel interview-script（含 JTBD 探询 + Mom Test 风格） + summarize-interview（transcript → JTBD + 行动项）+ Dean discovery-interview-prep（按研究目标定方法 + 题目 + 偏差预警）+ Codex transcribe（用 gpt-4o-mini-transcribe 或带说话人分离做转写） | [Pawel](https://github.com/phuryn/pm-skills) · [Dean](https://github.com/deanpeters/Product-Manager-Skills) · [Codex](https://github.com/openai/skills) |
| sentiment-analysis + analyze-feature-requests | 反馈情感分析 | Pawel sentiment-analysis（用户反馈情感打分 + JTBD 洞察）+ Pawel analyze-feature-requests（按主题/影响/努力/风险给 feature request 排优先级） | [Pawel](https://github.com/phuryn/pm-skills) |

### 3.2 问题框定 / 假设管理

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| problem-statement + problem-framing-canvas | 问题陈述 | Dean problem-statement（"I am / Trying to / But / Because / Which makes me feel" 五段式）+ problem-framing-canvas（MITRE 三段：Look Inward / Look Outward / Reframe + HMW） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) |
| identify-assumptions-existing + identify-assumptions-new + prioritize-assumptions | 假设识别 / 排序 | Pawel identify-assumptions-existing（V/U/V/F 4 维风险 + 验证建议）+ identify-assumptions-new（含 Ethical/Compliance 8 维）+ prioritize-assumptions（Impact × Risk 矩阵 + 实验配对 Strategyzer） | [Pawel](https://github.com/phuryn/pm-skills) |
| pre-mortem | Pre-mortem | Pawel pre-mortem（对 PRD / 发布计划做"假设它失败了，为什么"风险分析） | [Pawel](https://github.com/phuryn/pm-skills) |

### 3.3 产品发现 / 实验

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| opportunity-solution-tree | OST（Opportunity Solution Tree） | Dean opportunity-solution-tree + Pawel opportunity-solution-tree（Teresa Torres 框架：outcome → opportunities → solutions → experiments；Pawel 版强调 Importance ×(1−Satisfaction) opportunity score） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) · [Pawel](https://github.com/phuryn/pm-skills) |
| brainstorm-ideas-existing + brainstorm-ideas-new + brainstorm-experiments-existing | 脑暴点子（双路径） | Pawel brainstorm-ideas-existing（PM/设计师/工程师三视角给现有产品脑暴）+ brainstorm-ideas-new（早期发现阶段为新产品脑暴）+ Pawel brainstorm-experiments-existing / -new（lean pretotype Savoia） | [Pawel](https://github.com/phuryn/pm-skills) |
| prototype + pol-probe-advisor | Prototype 选型 | mattpocock prototype（写"丢弃式原型"——能跑的终端 app 或同一路由下几个差异巨大的 UI 变体）+ Dean pol-probe-advisor（推荐 5 种 prototype：Feasibility / Task-Focused / Narrative / Synthetic / Vibe） | [mattpocock](https://github.com/mattpocock/skills) · [Dean](https://github.com/deanpeters/Product-Manager-Skills) |
| ab-test-analysis + cohort-analysis | 实验数据分析 | Pawel ab-test-analysis（用样本量/p-value/置信区间/guardrail metric 评估 A/B 按"ship/extend/stop/investigate"决策；丢 CSV 还会生成 Python 算数）+ cohort-analysis（cohort 留存 + feature adoption + segment 切分） | [Pawel](https://github.com/phuryn/pm-skills) |
| discovery-process + lean-ux-canvas + storyboard | Lean UX / Discovery 编排 | Dean discovery-process（3-4 周完整发现循环 frame→research→synthesize→validate）+ Dean lean-ux-canvas（Jeff Gothelf v2 hypothesis-driven）+ Dean storyboard（6 帧叙事可视化用户旅程） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) |

### 3.4 战略 / 定位 / 商业模式

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| lean-canvas + business-model + startup-canvas + product-strategy + value-proposition | Canvas 全套 | Pawel lean-canvas（Ash Maurya 9 段，主动指出与 Startup Canvas 差异）+ business-model（Strategyzer 9 块 BMC）+ startup-canvas（Pawel 自创 = Product Strategy + Business Model 合并）+ product-strategy（Pawel 9-section Product Strategy Canvas）+ value-proposition（6 段式 JTBD 价值主张） | [Pawel](https://github.com/phuryn/pm-skills) |
| pestle-analysis + pestel-analysis + porters-five-forces + swot-analysis + ansoff-matrix | 外部环境分析 | Pawel pestle-analysis（PESTLE 6 维：政治/经济/社会/科技/法律/环境）+ Dean pestel-analysis + Pawel porters-five-forces（竞争/供应商/买家/替代品/新进入者）+ swot-analysis（SWOT + actionable 推荐）+ ansoff-matrix（4 象限：市场渗透/开发/产品开发/多元化） | [Pawel](https://github.com/phuryn/pm-skills) · [Dean](https://github.com/deanpeters/Product-Manager-Skills) |
| tam-sam-som-calculator + market-sizing | 市场规模 | Dean tam-sam-som-calculator（真实数据 + 引用 + VC 投递 deck）+ Pawel market-sizing（top-down + bottom-up 估 TAM/SAM/SOM） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) · [Pawel](https://github.com/phuryn/pm-skills) |
| positioning-statement + positioning-workshop + positioning-ideas + product-vision + press-release | 定位 / 愿景 | Dean positioning-statement（Geoffrey Moore "For/that need/is a/that/Unlike" 框架）+ positioning-workshop（自适应问题引导多人完成定位）+ Pawel positioning-ideas（差异化定位创意）+ product-vision（鼓舞人心又可达成的 vision statement）+ Dean press-release（Amazon Working Backwards 写"未来发布稿"） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) · [Pawel](https://github.com/phuryn/pm-skills) |
| product-strategy-session + roadmap-planning + outcome-roadmap | 战略编排 workflow | Dean product-strategy-session（2-4 周完整战略 session：positioning→framing→exploration→roadmap）+ Dean roadmap-planning（1-2 周战略 roadmap：inputs→epics→prioritize→sequence→communicate）+ Pawel outcome-roadmap（output→outcome roadmap 改造） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) · [Pawel](https://github.com/phuryn/pm-skills) |

### 3.5 GTM / 进入策略 / 增长 loop

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| beachhead-segment + gtm-motions + gtm-strategy | 滩头市场 + GTM 动作 | Pawel beachhead-segment（Geoffrey Moore：burning pain × WTP × winnable × referral 4 维选第一个市场 + 90 天获客方案）+ gtm-motions（7 种 GTM 动作 PLG/SLG/ABM/Inbound/Outbound/Community/Channel 选组合）+ gtm-strategy（渠道 + message + 发布时间线） | [Pawel](https://github.com/phuryn/pm-skills) |
| growth-loops | 增长 loop | Pawel growth-loops（5 类 flywheel 识别合适的 growth loop） | [Pawel](https://github.com/phuryn/pm-skills) |
| north-star-metric | 北极星指标 | Pawel north-star-metric（先把业务划成 Attention/Transaction/Productivity 三类 game，再按 7 项标准选 NSM + 3-5 个 input metric） | [Pawel](https://github.com/phuryn/pm-skills) |

### 3.6 PRD / Spec / 工程 handoff

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| create-prd + prd-development + to-prd + prd-generator | PRD 写作 | Pawel create-prd（8 节模板：Summary/Contacts/Background/Objective/Market/Value Prop/Solution/Release）+ Dean prd-development（2-4 天结构化 PRD：problem→personas→solution→metrics→stories）+ mattpocock to-prd（把当前对话上下文直接合成 PRD 并提交成 GitHub issue）+ founder-skills prd-generator（给 AI 编程工具用的 PRD，输出 PDF） | [Pawel](https://github.com/phuryn/pm-skills) · [Dean](https://github.com/deanpeters/Product-Manager-Skills) · [mattpocock](https://github.com/mattpocock/skills) · [founder-skills](https://github.com/ognjengt/founder-skills) |
| user-stories + wwas + user-story + user-story-splitting + epic-breakdown-advisor + epic-hypothesis | User Story / 拆任务 | Pawel user-stories（INVEST + 3C's）+ wwas（Why-What-Acceptance）+ Dean user-story（Mike Cohn + Gherkin）+ user-story-mapping/(workshop)（Patton backbone + release slice）+ user-story-splitting + Dean epic-breakdown-advisor（Lawrence 9 splitting pattern）+ Dean epic-hypothesis（initiative→hypothesis 改写） | [Pawel](https://github.com/phuryn/pm-skills) · [Dean](https://github.com/deanpeters/Product-Manager-Skills) |
| notion-spec-to-implementation + to-issues + linear-claude-skill + linear | Spec → 工程 | Codex notion-spec-to-implementation（Notion spec 解析成实现计划页 + 任务库 + 互相关联）+ mattpocock to-issues（把 plan 拆成 vertical slice issue）+ wrsmith108 linear-claude-skill（Linear 任务管理：MCP / linear CLI / 辅助脚本三 backend；管理 issue/project/initiative/label/state；批量 sync 代码改动到 ticket）+ Codex linear（同 Linear MCP，sprint plan/bug triage/release plan/retro） | [Codex](https://github.com/openai/skills) · [mattpocock](https://github.com/mattpocock/skills) · [wrsmith108](https://github.com/wrsmith108/linear-claude-skill) |

### 3.7 优先级 / 投资决策

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| prioritization-frameworks + prioritization-advisor + prioritize-features | 优先级框架对比 | Pawel prioritization-frameworks（9 框架：RICE/ICE/Kano/WSJF/MoSCoW/Cost of Delay/Story Mapping/Buy a Feature/Opportunity Score）+ Dean prioritization-advisor（推荐合适框架 + 评估表）+ Pawel prioritize-features（4 维：影响/努力/风险/战略对齐） | [Pawel](https://github.com/phuryn/pm-skills) · [Dean](https://github.com/deanpeters/Product-Manager-Skills) |
| feature-investment-advisor + acquisition-channel-advisor + finance-based-pricing-advisor | 投资 / ROI | Dean feature-investment-advisor（ROI + 战略价值评分）+ Dean acquisition-channel-advisor（unit economics 评估渠道 CAC/LTV/payback/利润 → scale/test/kill）+ Dean finance-based-pricing-advisor（财务影响分析评估定价改动） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) |

### 3.8 SaaS 健康 / 财务指标 / 单位经济

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| business-health-diagnostic + pm-operator | SaaS 诊断 | Dean business-health-diagnostic（诊断 SaaS 健康度，列红旗按修复价值排优先）+ Digidai pm-operator（30+ 框架 + SaaS 诊断 输入 MRR/churn/CAC 给诊断 + PRD 同侪审稿 + 6 阶段全 PM Sprint Discover→Position→Prioritize→Specify→Validate→Measure + Coaching 模式） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) · [Digidai](https://github.com/Digidai/product-manager-skills) |
| finance-metrics-quickref + saas-economics-efficiency-metrics + saas-revenue-growth-metrics | 财务速查 | Dean finance-metrics-quickref（32+ SaaS 财务指标公式 + benchmark 速查）+ saas-economics-efficiency-metrics（CAC/LTV/payback/Rule of 40/burn multiple）+ saas-revenue-growth-metrics（MRR/ARR/churn/NRR/expansion） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) |

### 3.9 OKR / Sprint / Retro / Stakeholder

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| brainstorm-okrs + sprint-plan + retro | OKR / Sprint | Pawel brainstorm-okrs（与公司目标对齐的团队 OKR）+ Pawel sprint-plan（容量 + 故事选择 + 风险映射）+ Pawel retro（结构化 sprint retrospective + action items） | [Pawel](https://github.com/phuryn/pm-skills) |
| summarize-meeting + stakeholder-map + workshop-facilitation | 会议 / 利益相关者 | Pawel summarize-meeting（transcript → 结构化纪要 + 待办）+ Pawel stakeholder-map（power × interest 矩阵 + 沟通计划）+ Dean workshop-facilitation（任意 workshop 主持） | [Pawel](https://github.com/phuryn/pm-skills) · [Dean](https://github.com/deanpeters/Product-Manager-Skills) |
| altitude-horizon-framework + director-readiness-advisor + vp-cpo-readiness-advisor + executive-onboarding-playbook | PM 升职 / 领导力 | Dean altitude-horizon-framework（PM→Director scope/time horizon/失败模式 mindset 转变）+ director-readiness-advisor（4 类关键场景应对）+ vp-cpo-readiness-advisor（Director→VP/CPO 转变 + CEO 面试框架）+ executive-onboarding-playbook（30-60-90 天 VP/CPO 入职诊断） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) |

### 3.10 发布 / EOL / 沟通

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| release-notes + eol-message | Release Notes / EOL | Pawel release-notes（ticket/changelog → 用户向发布说明）+ Dean eol-message（产品/功能下线含时间表/迁移路径/补偿） | [Pawel](https://github.com/phuryn/pm-skills) · [Dean](https://github.com/deanpeters/Product-Manager-Skills) |
| internal-comms | 企业内部沟通 | Anthropic internal-comms（3P 进度 / company newsletter / FAQ / leadership update / incident report） | [Anthropic](https://github.com/anthropics/skills) |

### 3.11 PM 元能力

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| ai-shaped-readiness-advisor | AI 转型诊断 | Dean ai-shaped-readiness-advisor（5 项 competency 诊断"自动化 vs 重设计" AI 机会） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) |
| recommendation-canvas | AI 推荐功能 doc | Dean recommendation-canvas（数据/算法/置信/回退/UX 文档化） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) |
| company-research | 公司调研 | Dean company-research（产品/定位/财务/市场/客户深度分析） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) |
| skill-authoring-workflow | 元工作流 | Dean skill-authoring-workflow（写 PM skill 自身的元工作流） | [Dean](https://github.com/deanpeters/Product-Manager-Skills) |

---

## 四、营销 / 增长 / 销售

### 4.1 SEO / AEO / GEO / 结构化数据

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| seo-audit + ai-seo + programmatic-seo + schema + site-architecture + content-strategy | SEO 全套（Corey Haines 6 件） | seo-audit（技术/on-page/Core Web Vitals/indexing/爬错给优先级清单）+ ai-seo（AI Overviews / ChatGPT / Perplexity / Gemini 引用优化，AEO/GEO/LLMO 策略）+ programmatic-seo（12 套 playbook：Templates/Curation/Comparisons/Locations/Personas/Integrations/Glossary/Profiles 做 templated 落地页避免 thin-content）+ schema（schema.org JSON-LD：Article/FAQ/Product/HowTo/Organization）+ site-architecture（页面层级/导航/URL/面包屑/内链 hub-and-spoke）+ content-strategy（写啥 + topic cluster + editorial calendar） | [Corey](https://github.com/coreyhaines31/marketingskills) |
| claude-seo | 大型 SEO 仓库 | AgriciDaniel/claude-seo（25 skill + 13 sub-agent + 17 脚本）：on-page 优化 / 技术 SEO / 结构化数据校验 / Search Console + PageSpeed Insights + Google Ads API 集成；可直接把 meta tag、schema markup、关键词出价改动 ship 到源码或 CMS | [AgriciDaniel-seo](https://github.com/AgriciDaniel/claude-seo) |
| seo-geo | 生成引擎优化 | ReScienceLab seo-geo（GEO = Generative Engine Optimization for ChatGPT/Perplexity/Google） | [ReScienceLab](https://github.com/ReScienceLab/opc-skills) |

### 4.2 文案 / 营销心理 / 产品命名

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| copywriting + copy-editing + marketing-psychology | 文案三件套 ⛓ | Corey copywriting（写或重写 landing/home/pricing/feature/about：headline 公式 + CTA + 特性→收益→结果）+ copy-editing（7-pass sweeps：clarity/specificity/verbs/cuts/voice/proof/consistency 改现成 copy 不重写）+ marketing-psychology（first principles/JTBD/social proof/scarcity/loss aversion/anchoring/Cialdini 七原则） | [Corey](https://github.com/coreyhaines31/marketingskills) |
| brand-copywriter | 品牌文案 | founder-skills brand-copywriter（AIDA/PAS/BAB 框架文案：广告 / landing / 邮件） | [founder-skills](https://github.com/ognjengt/founder-skills) |
| value-prop-statements | 价值主张 / Value Prop | Pawel value-prop-statements（营销 / 销售 / onboarding 多场景 value prop） | [Pawel](https://github.com/phuryn/pm-skills) |
| product-name | 产品命名 | Pawel product-name（5 个对齐品牌价值的产品名） | [Pawel](https://github.com/phuryn/pm-skills) |

### 4.3 多渠道分发（邮件 / SMS / 社交）

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| emails + cold-email | 邮件全套 | Corey emails（生命周期邮件 / drip / 欢迎 / win-back）+ cold-email（人味 B2B 冷邮件 + 多步 follow-up：observation→problem→proof→ask 框架，禁用 leverage/synergy buzzword） | [Corey](https://github.com/coreyhaines31/marketingskills) |
| sms | 短信营销 | Corey sms（短信营销 / 交易短信 / 序列含合规与发送频率） | [Corey](https://github.com/coreyhaines31/marketingskills) |
| social + x-writer + linkedin-writer | 社媒平台 写作 | Corey social（LinkedIn/X/Instagram/TikTok 发帖 + calendar）+ founder-skills x-writer（51+ 模板 × 6 voice：Hormozi/Naval/Gazdecki/Dakota/Machina/Ognjen × 8 format）+ linkedin-writer（8+ 模板 × 7 format：Lessons/Blueprint/Story/Strategy/Case/Hot Take/Quick Hack） | [Corey](https://github.com/coreyhaines31/marketingskills) · [founder-skills](https://github.com/ognjengt/founder-skills) |
| outreach-specialist | B2B 外联 | founder-skills outreach-specialist（cold email/LinkedIn DM/X DM 8 模板 + 跟进策略） | [founder-skills](https://github.com/ognjengt/founder-skills) |

### 4.4 付费广告 / ASO

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| ads + ad-creative | 广告策略 / 创意 | Corey ads（Google/Meta/LinkedIn/TikTok/X campaign 策略 / 人群 / bidding / 预算 / retargeting / ROAS / CPA）+ ad-creative（大批量产 RSA headline/description/primary text + bulk 变体 + creative testing） | [Corey](https://github.com/coreyhaines31/marketingskills) |
| claude-ads | 付费广告全账户审计 | AgriciDaniel/claude-ads（Google Ads / Meta Ads 全账户 audit，资深 PPC 人手要 4-6 小时的活让 agent 跑完） | [AgriciDaniel-ads](https://github.com/AgriciDaniel/claude-ads) |
| aso | App 商店优化 | Corey aso（App Store / Google Play 评分/关键词/视觉/评论审计） | [Corey](https://github.com/coreyhaines31/marketingskills) |

### 4.5 CRO / 转化优化

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| cro + popups + paywalls + signup + onboarding | CRO 一组 | Corey cro（已合并 page-cro/popup-cro/form-cro/paywall-cro/onboarding-cro/signup-flow-cro 6 个为单 skill：现有需求/阻力消除/紧迫感/信任 4 维诊断）+ popups（modal/slide-in/exit-intent + 触发时机/文案/表单字段/设备适配）+ paywalls（in-app 升级 modal + loss aversion/anchoring 心理学）+ signup（注册转化 + 试用激活 + 减摩擦）+ onboarding（缩短 time-to-value + 激活事件） | [Corey](https://github.com/coreyhaines31/marketingskills) |
| cro-optimization | CRO 优化大集合 | founder-skills cro-optimization（13 项 CRO 原则诊断 landing page 给前后对比改写） | [founder-skills](https://github.com/ognjengt/founder-skills) |
| ab-testing | A/B 实验设计 | Corey ab-testing（写 hypothesis / 算样本量 / 严控提前 stop / 实验 backlog） | [Corey](https://github.com/coreyhaines31/marketingskills) |

### 4.6 潜客 / 引流 / 推荐 / 联盟

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| lead-magnets + lead-magnet-generator | Lead Magnet | Corey lead-magnets（ebook/checklist/模板/报告 + 落地页 + 邮件抓取漏斗）+ founder-skills lead-magnet-generator（带 CTA 的 lead magnet：X/LinkedIn 快/详细版） | [Corey](https://github.com/coreyhaines31/marketingskills) · [founder-skills](https://github.com/ognjengt/founder-skills) |
| prospecting + customer-research | 潜客 / 客户研究 | Corey prospecting（建/筛 ICP-fit 名单：行业/tech stack/招聘信号）+ Corey customer-research（用户访谈 / review mining / support ticket 提炼 VOC + JTBD） | [Corey](https://github.com/coreyhaines31/marketingskills) |
| free-tools | 免费工具引流 | Corey free-tools（规划免费工具策略：定题/UX/SEO 价值/转化路径） | [Corey](https://github.com/coreyhaines31/marketingskills) |
| referrals + directory-submissions + community-marketing + co-marketing | 推荐 / 联盟 / 社区 / 联合 | Corey referrals（客户推荐 / affiliate / WoM 含奖励结构 / 漏斗 / 追踪）+ directory-submissions（SaaS / 产品 / 本地 / 行业目录提交）+ community-marketing（Discord/Slack/Reddit/Circle/Discourse 社区 + ambassador）+ co-marketing（找 ideal partner + joint campaign） | [Corey](https://github.com/coreyhaines31/marketingskills) |

### 4.7 病毒式传播 / Hook / 创意

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| viral-hook-creator + marketing-ideas | Hook / 创意点子 | founder-skills viral-hook-creator（写病毒式内容 hook）+ marketing-ideas（160+ 策略库给 5 条最佳）+ Pawel marketing-ideas（5 条创意 + 低成本营销点子 + rationale）+ Corey marketing-ideas（SaaS campaign 创意） | [founder-skills](https://github.com/ognjengt/founder-skills) · [Pawel](https://github.com/phuryn/pm-skills) · [Corey](https://github.com/coreyhaines31/marketingskills) |

### 4.8 竞品 / 对比页 / 战情

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| competitor-analysis + competitive-battlecard + competitor-profiling + competitor-intel | 竞品分析 | Pawel competitor-analysis（优势/劣势/差异化）+ competitive-battlecard（销售用 battlecard："我们 vs Salesforce"）+ Corey competitor-profiling（从 URL 起步 + 实页抓 + SEO + review 数据出标准化 profile）+ founder-skills competitor-intel（指标 + leverage 策略 + 下一步预测） | [Pawel](https://github.com/phuryn/pm-skills) · [Corey](https://github.com/coreyhaines31/marketingskills) · [founder-skills](https://github.com/ognjengt/founder-skills) |
| competitors | 比较 / 替代页（SEO） | Corey competitors（4 种格式 [Competitor] alternative / alternatives / You vs / A vs B 写 SEO + 销售比较页） | [Corey](https://github.com/coreyhaines31/marketingskills) |

### 4.9 销售辅助 / RevOps / 留存

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| sales-enablement | 销售辅助 | Corey sales-enablement（pitch deck / one-pager / objection handling / demo script / battle card） | [Corey](https://github.com/coreyhaines31/marketingskills) |
| revops | RevOps | Corey revops（lead lifecycle / scoring / SLA / marketing-to-sales handoff / CRM 字段） | [Corey](https://github.com/coreyhaines31/marketingskills) |
| churn-prevention | 流失防御 | Corey churn-prevention（cancel flow / save offer / dunning / failed payment recovery / win-back，区分 voluntary vs involuntary） | [Corey](https://github.com/coreyhaines31/marketingskills) |

### 4.10 定价 / 商业模型

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| pricing-strategy + pricing + pricing-strategist + monetization-strategy | 定价策略 | Pawel pricing-strategy（含 WTP 估算）+ Corey pricing（SaaS pricing tier / 计费模型 / 年付折扣 / grandfather / psychological anchor）+ founder-skills pricing-strategist（交互 Q&A 出分层定价 + revenue optimization）+ Pawel monetization-strategy（3-5 个变现策略 + 验证实验） | [Pawel](https://github.com/phuryn/pm-skills) · [Corey](https://github.com/coreyhaines31/marketingskills) · [founder-skills](https://github.com/ognjengt/founder-skills) |

### 4.11 GTM / 发布 / Product Hunt

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| launch + go-to-market-plan + product-hunt-launch-plan | 发布 GTM | Corey launch（产品/功能发布 + 合作伙伴 + 渠道 + PR + PH 等）+ founder-skills go-to-market-plan（3 套 GTM 策略）+ founder-skills product-hunt-launch-plan（PH 拿 #1 战术：小时级 battle plan + 模板 + 20+ 备选发布平台） | [Corey](https://github.com/coreyhaines31/marketingskills) · [founder-skills](https://github.com/ognjengt/founder-skills) |
| strategic-planning | 战略规划 | founder-skills strategic-planning（诊断瓶颈给 3 个高影响下一步） | [founder-skills](https://github.com/ognjengt/founder-skills) |

### 4.12 SOP / 测量

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| sop-creator | SOP | founder-skills sop-creator（写企业流程 SOP，员工 onboarding 等） | [founder-skills](https://github.com/ognjengt/founder-skills) |
| product-marketing + analytics | 基座上下文 / 测量 | Corey product-marketing（维护 product-marketing.md 单一上下文：定位/ICP/声明/差异化/关键 message，其他 marketing skill 启动时优先读它）+ Corey analytics（GA4/GTM/Mixpanel/Amplitude/PostHog/Segment 跟踪 + tracking plan + UTM 规范 + debug） | [Corey](https://github.com/coreyhaines31/marketingskills) |

---

## 五、设计 / 视觉 / 前端

### 5.1 品牌系统 / 视觉规范

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| brand-guidelines + theme-factory + canvas-design | 品牌视觉三件套 ⛓ | Anthropic brand-guidelines（注入 Anthropic 色系字体：dark #141413、orange #d97757、Poppins/Lora）+ theme-factory（10 套预设主题：Ocean Depths / Sunset Boulevard / Modern Minimalist / Tech Innovation 等）+ canvas-design（把视觉哲学落到博物馆/杂志级 PNG/PDF 海报） | [Anthropic](https://github.com/anthropics/skills) |

### 5.2 前端工程规范

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| frontend-design | 前端美学 | Anthropic frontend-design（让 Claude 跳出 AI slop，用极简 / 野兽 / 复古未来主义等明确美学方向写生产级 UI） | [Anthropic](https://github.com/anthropics/skills) |
| web-design-guidelines + react-best-practices + composition-patterns | Vercel 三件套 | vercel-labs web-design-guidelines（100+ 条规则跨 11 类：可访问性 aria/语义 HTML/键盘 + focus 状态 + 表单 autocomplete/校验 + 动效 prefers-reduced-motion + 排印 curly quotes/tabular-nums + 图片 lazy/alt + 性能 preconnect + URL 反映状态 + dark mode color-scheme/theme-color + 触控 touch-action + Intl 国际化）+ react-best-practices（40+ 条规则按 Critical/High/Medium/Low 排成 8 类：消除瀑布请求 / bundle size / 服务端性能 / 客户端 fetch / 重渲染 / 渲染性能 / JS 微优化）+ composition-patterns（治"boolean prop 爆炸"：把 <Modal showHeader showFooter showClose closable…> 重构成 compound component <Modal.Header /> <Modal.Body />，状态提升减少 prop） | [vercel-labs](https://github.com/vercel-labs/agent-skills) |
| ui-ux-pro-max-skill | 跨平台 UI/UX | nextlevelbuilder/ui-ux-pro-max-skill（写组件库 / 视觉风格 / 多平台适配的设计指导原则） | [nextlevelbuilder](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) |

### 5.3 UI artifact / Web app 构建

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| web-artifacts-builder | 单文件 React HTML artifact | Anthropic web-artifacts-builder（React 18 + TS + Vite + Tailwind + shadcn/ui 构建 Claude.ai 单文件 HTML，Parcel + html-inline 打包） | [Anthropic](https://github.com/anthropics/skills) |

### 5.4 Figma 双向集成

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| figma + figma-use + figma-create-new-file + figma-generate-design + figma-generate-library + figma-implement-design + figma-code-connect-components + figma-create-design-system-rules | Figma 8 件套 ⛓ | Codex figma（总入口路由：先 get_design_context → get_metadata → get_screenshot 再实现）+ figma-use（强制前置硬规则：return 而非 figma.notify、loadFontAsync、color 0–1、变量 scope 必填）+ figma-create-new-file（drafts 下建空白文件）+ figma-generate-design（代码/描述译成 Figma 屏，用已发布组件 + tokens 装配）+ figma-generate-library（反向造专业设计系统：discovery → tokens → 文档页 → 组件 → 验证，20-100+ API 调用分阶段）+ figma-implement-design（Figma 节点 1:1 像素级译成代码）+ figma-code-connect-components（Code Connect 映射 Org/Enterprise）+ figma-create-design-system-rules（生成 CLAUDE.md / .cursor/rules 等 agent rule） | [Codex](https://github.com/openai/skills) |

### 5.5 演示 / 幻灯片生成

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| pptx | PPTX 标准生成 | Anthropic pptx（10 套配色 + 字体规则 + subagent 视觉 QA） | [Anthropic](https://github.com/anthropics/skills) |
| NanoBanana-PPT-Skills | PPT 视频流水线 | op7418/NanoBanana-PPT-Skills（文档分析提炼大纲 → Nano Banana Pro 出"渐变毛玻璃卡片风格"图 → 可灵 AI 生成转场视频 → FFmpeg 合成 + 交互 web 播放器） | [op7418-NB](https://github.com/op7418/NanoBanana-PPT-Skills) |
| frontend-slides | 零依赖 HTML 演示 | zarazhangrui/frontend-slides（1920×1080 固定 16:9 stage + 12 视觉风格预设 + bold-template-pack 可视化预览卡 + PPTX 转 web + Playwright 导 PDF + Vercel 部署） | [zarazhangrui](https://github.com/zarazhangrui/frontend-slides) |
| huashu-design | HTML-native 设计 skill | alchaincyf/huashu-design（高保真原型 / 幻灯片 / 动画 + 20 设计哲学 + 5 维评审 + MP4 导出，用 HTML 当万能设计画布） | [alchaincyf](https://github.com/alchaincyf/huashu-design) |
| slack-gif-creator | Slack 动画素材 | Anthropic slack-gif-creator（生成符合 Slack 限制的 128×128 emoji 或 480×480 ≤2MB 动画 GIF） | [Anthropic](https://github.com/anthropics/skills) |

### 5.6 开源设计 skill 包

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| open-design | Claude Design 本地化平替 | nexu-io/open-design（19 skill）：local-first + BYOK + 支持 16 个 coding-agent CLI；交互式目录两个 mode，prototype 模式自带 32 个子 skill（杂志风落地页/动画/原型）；自家定义了 SKILL.md 协议扩展 | [nexu-io](https://github.com/nexu-io/open-design) |

### 5.7 创意 / 艺术 / 品牌资产

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| algorithmic-art | 算法艺术 | Anthropic algorithmic-art（用 p5.js 生成"算法哲学"驱动的生成艺术：noise field / 粒子系统等，输出 .md 哲学 + .html 观察器 + .js 算法） | [Anthropic](https://github.com/anthropics/skills) |
| nanobanana | AI 出图（Nano Banana Pro） | ReScienceLab nanobanana（用 Gemini 3 Pro Image Preview 出图） | [ReScienceLab](https://github.com/ReScienceLab/opc-skills) |
| logo-creator + banner-creator + image | Logo / Banner 生成 ⛓ | ReScienceLab logo-creator（AI 出 logo + 裁剪 + 去背 + 导 SVG，依赖 nanobanana）+ banner-creator（GitHub/Twitter/LinkedIn banner，依赖 nanobanana）+ Corey image（营销图 brief：广告 creative / 社媒 / 博客封面 / infographic） | [ReScienceLab](https://github.com/ReScienceLab/opc-skills) · [Corey](https://github.com/coreyhaines31/marketingskills) |

### 5.8 截图 / 多媒体生成

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| screenshot | 跨 OS 截屏 | Codex screenshot（含 macOS 权限预检） | [Codex](https://github.com/openai/skills) |
| imagegen | AI 出图（Codex） | Codex imagegen（默认走 Codex 内置 image_gen 工具生成位图） | [Codex](https://github.com/openai/skills) |
| hatch-pet | 动画 sprite 生成 ⛓ | Codex hatch-pet（端到端造 Codex 兼容动画宠物：8×9 spritesheet + 8 状态行 + QA contact sheet + motion preview，依赖 imagegen） | [Codex](https://github.com/openai/skills) |

---

## 六、媒体生产

### 6.1 视频剪辑 / 生成

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| Youtube-clipper-skill | YouTube 剪辑流水线 | op7418/Youtube-clipper-skill（6 阶段：环境检测 → yt-dlp 下载视频 + VTT 字幕 → AI 分析字幕做 2-5 分钟级章节切分 → AskUserQuestion 选段 → ffmpeg-full 剪辑 + 中英双语字幕 + libass 烧录 + 总结文案） | [op7418-YT](https://github.com/op7418/Youtube-clipper-skill) |
| OpenMontage | Agentic 视频生产引擎 | calesthio/OpenMontage（自称"世界第一个开源 agentic 视频生产引擎"：可纯生成图片视频含 Ken Burns 动效 + 配音 + 字幕，也可剪真视频；目标让 Claude 用 0 成本做纪录片 / 广告） | [calesthio](https://github.com/calesthio/OpenMontage) |
| skills | Remotion 程序化视频 | remotion-dev/skills/remotion（Remotion React 项目 best practices：音视频时长 / 帧率 / Composition / useCurrentFrame / 性能 / 渲染参数等约束，Remotion 官方文档直接引用） | [remotion-dev](https://github.com/remotion-dev/skills) |
| video | 多渠道视频脚本 | Corey video（视频脚本 / shorts / demo / YouTube 规划） | [Corey](https://github.com/coreyhaines31/marketingskills) |

### 6.2 音频 / TTS / 转写

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| speech + transcribe | TTS / 转写 | Codex speech（OpenAI Audio API 做 TTS：旁白 / IVR / 可访问性）+ Codex transcribe（用 gpt-4o-mini-transcribe 或带说话人分离做转写） | [Codex](https://github.com/openai/skills) |

---

## 七、数据 / 抓取 / 情报

### 7.1 网页抓取 / 爬虫

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| firecrawl-build + firecrawl-build-onboarding + firecrawl-build-scrape + firecrawl-build-search + firecrawl-build-interact | Firecrawl 抓取流水线 ⛓ | firecrawl-build（入口路由 /scrape /search /interact 三窄端点）+ firecrawl-build-onboarding（装 SDK + 浏览器授权 + 写 FIRECRAWL_API_KEY + 跑通第一次调用）+ firecrawl-build-scrape（已知 URL 拿 markdown/HTML/链接/截图/结构化字段，默认 markdown + onlyMainContent）+ firecrawl-build-search（从 query 起步找候选页，可 hydrate 成完整内容）+ firecrawl-build-interact（处理点击/填表/分页/登录后访问等 /scrape 搞不定的动态页） | [Firecrawl](https://github.com/firecrawl/cli) |
| agent-browser | 浏览器 agent CLI | vercel-labs/agent-browser（Chrome DevTools Protocol：导航 / 填表 / 点击 / 截图 / 抓数据） | [vercel-labs](https://github.com/vercel-labs/agent-skills) |

### 7.2 跨平台社交 / 趋势监测

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| last30days-skill | 多源情报聚合 | mvanhorn/last30days-skill（把 Reddit upvote / X 点赞 / YouTube 转录 / HN / Polymarket 真金白银 / GitHub star 当成"投票"：并行搜索 + 多 query 扩展 + engagement+freshness 评分 + 跨源去重聚合 + 引用合成；--store 进 SQLite + watchlist + briefing 做趋势监控 + Slack/webhook 推送） | [mvanhorn](https://github.com/mvanhorn/last30days-skill) |
| reddit + twitter + producthunt + requesthunt | 平台单点查询 | ReScienceLab reddit（Reddit JSON API 查内容）+ twitter（用 twitterapi.io 查 X）+ producthunt（查 PH 帖子/topic/user/collection）+ requesthunt（在 Reddit/X/GitHub 挖用户需求） | [ReScienceLab](https://github.com/ReScienceLab/opc-skills) |
| domain-hunter | 域名查找 + 比价 ⛓ | ReScienceLab domain-hunter（依赖 twitter + reddit；域名查找 + 注册商比价 + 优惠码） | [ReScienceLab](https://github.com/ReScienceLab/opc-skills) |

### 7.3 数据库 / SQL / 分析

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| sql-queries | 自然语言 → SQL | Pawel sql-queries（覆盖 BigQuery / PostgreSQL / MySQL / Snowflake / SQL Server，可读 schema 给优化建议） | [Pawel](https://github.com/phuryn/pm-skills) |
| metrics-dashboard | 指标 dashboard 设计 | Pawel metrics-dashboard（产品指标 dashboard + 数据源 + 告警阈值） | [Pawel](https://github.com/phuryn/pm-skills) |
| dummy-dataset | 测试 / 假数据生成 | Pawel dummy-dataset（生成 CSV / JSON / SQL 格式真实感假数据） | [Pawel](https://github.com/phuryn/pm-skills) |

### 7.4 Notebook / 文档型分析

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| jupyter-notebook | Jupyter Notebook | Codex jupyter-notebook（起 experiment 或 tutorial 两类干净可复现 notebook，避免手写 JSON 出错） | [Codex](https://github.com/openai/skills) |

---

## 八、求职 / 个人办公

### 8.1 简历 / Cover Letter / LinkedIn

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| resume-ats-optimizer + resume-bullet-writer + resume-quantifier + resume-formatter + resume-section-builder | Resume 优化（5 件） | Paramchoudhary resume-ats-optimizer（ATS 兼容 + 关键词命中）+ resume-bullet-writer（弱 bullet 改成成就+指标+影响）+ resume-quantifier（给 bullet 加可量化数字）+ resume-formatter（干净易扫格式）+ resume-section-builder（定向构造 leadership 章节） | [Paramchoudhary](https://github.com/Paramchoudhary/ResumeSkills) |
| job-description-analyzer + resume-tailor + resume-version-manager + offer-comparison-analyzer | Job Search（4 件） | Paramchoudhary job-description-analyzer（JD 匹配分 + gap + 申请策略）+ resume-tailor（针对 JD 改简历，保持真实）+ resume-version-manager（多版本管理）+ offer-comparison-analyzer（offer 对比） | [Paramchoudhary](https://github.com/Paramchoudhary/ResumeSkills) |
| cover-letter-generator + linkedin-profile-optimizer + portfolio-case-study-writer + reference-list-builder | Supporting Docs（4 件） | Paramchoudhary cover-letter-generator（用简历+JD 生成个性化 cover letter）+ linkedin-profile-optimizer（LinkedIn 同步 + 可搜索性优化）+ portfolio-case-study-writer（作品集 case study）+ reference-list-builder（推荐人清单） | [Paramchoudhary](https://github.com/Paramchoudhary/ResumeSkills) |
| tech-resume-optimizer + executive-resume-writer + academic-cv-builder + creative-portfolio-resume + career-changer-translator | 专业化简历 | Paramchoudhary tech-resume-optimizer（工程/PM/技术高管）+ executive-resume-writer（C-suite/VP）+ academic-cv-builder（学术 CV）+ creative-portfolio-resume（设计/创意类）+ career-changer-translator（跨行业转岗"翻译"经验） | [Paramchoudhary](https://github.com/Paramchoudhary/ResumeSkills) |
| review-resume | PM 简历审查 | Pawel review-resume（对照 10 项最佳实践：XYZ+S 公式 + 关键词 + 结构 逐条审） | [Pawel](https://github.com/phuryn/pm-skills) |

### 8.2 面试 / 谈判 / 求职流水线

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| interview-prep-generator + interview-prep | 面试准备 | Paramchoudhary interview-prep-generator（从简历生成 STAR 故事 + 练习题 + 谈点）+ santifer career-ops::interview-prep（STAR+R 框架） | [Paramchoudhary](https://github.com/Paramchoudhary/ResumeSkills) · [santifer](https://github.com/santifer/career-ops) |
| salary-negotiation-prep | 薪资谈判 | Paramchoudhary salary-negotiation-prep（市场行情研究 + 谈判脚本） | [Paramchoudhary](https://github.com/Paramchoudhary/ResumeSkills) |
| career-ops + liveness + scan + batch + pdf + cv-sync-check | 求职自动化系统 | santifer/career-ops 14 mode：oferta（A-F 评分单 JD）+ liveness（JD 是否还挂着）+ scan（扫 Greenhouse/Ashby/Lever portal）+ batch（批处理 N 个 JD）+ pdf（生成 ATS-optimized PDF Playwright + HTML 模板）+ cv-sync-check / followup-cadence / merge-tracker / dedup / doctor / analyze-patterns / normalize-statuses；带 Go BubbleTea TUI dashboard | [santifer](https://github.com/santifer/career-ops) · [Anthropic](https://github.com/anthropics/skills) |

### 8.3 个人法律文档

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| draft-nda + privacy-policy | NDA / 隐私政策 | Pawel draft-nda（信息类型 / 司法管辖 / 关键条款）+ Pawel privacy-policy（含 GDPR/CCPA 合规考量） | [Pawel](https://github.com/phuryn/pm-skills) |

---

## 九、通信 / 工具集成

### 9.1 即时通讯集成

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| integrate-whatsapp + automate-whatsapp + observe-whatsapp | WhatsApp 三件套 ⛓ | gokapso integrate-whatsapp（接 Cloud API + 配 webhook + 发 message/template/flow）+ automate-whatsapp（用 workflow / agent / function / database 搭自动化）+ observe-whatsapp（debug 投递问题 + 查 webhook delivery + 健康检查）。三者依赖同一 Kapso API（KAPSO_API_BASE_URL + KAPSO_API_KEY） | [gokapso](https://github.com/gokapso/agent-skills) |

### 9.2 项目管理 / Issue 追踪

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| linear-claude-skill + linear | Linear 任务管理 | wrsmith108/linear-claude-skill（MCP / linear CLI / 辅助脚本三 backend 自适应；管理 issue / project / initiative / label / state；批量 sync 代码改动到 Linear ticket）+ Codex linear（Linear MCP，做 sprint plan / bug triage / 文档审计 / 负载均衡 / release plan / retro） | [wrsmith108](https://github.com/wrsmith108/linear-claude-skill) · [Codex](https://github.com/openai/skills) |

### 9.3 桌面 Agent 编排平台

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| Dorothy | 多 agent 桌面 app | Charlie85270/Dorothy（"AI agent 们的老婆"——并行编排多 CLI agent 的 Electron 桌面 App）：Kanban 自动派单 + 定时任务 + GitHub PR/Issue 触发自动化 + Telegram + Slack 远程控制 + 本地 Vault（FTS index SQLite）+ Twitter/X 数据 MCP + Google Workspace 集成；6 内置 MCP server（kanban / orchestrator / socialdata / telegram / vault / world / x） | [Charlie85270](https://github.com/Charlie85270/Dorothy) |

### 9.4 Sleep-time 自治研究

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| Auto-claude-code-research-in-sleep | 睡眠时长跑研究 ARIS | wanshuiyin/Auto-claude-code-research-in-sleep（搭好 schedule + skill 组合，AI 在你不在线时长跑 research / 调研 / 总结） | [wanshuiyin](https://github.com/wanshuiyin/Auto-claude-code-research-in-sleep) |

---

## 十、创业 / 财务 / 合规

### 10.1 创业者综合 toolkit

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| founder-skills | Founder 工具箱 | ognjengt/founder-skills（共用 FOUNDER_CONTEXT.md 基座上下文；含战略 / 销售 / 内容创作 / 工程交付 4 类共 15 skill：详见前文 §3-§4 各小节，在不同功能分类下被引用） | [founder-skills](https://github.com/ognjengt/founder-skills) |
| gstack | YC CEO 个人配置 | garrytan/gstack（YC CEO Garry Tan 个人 Claude Code 配置开源版：6 个 slash command/skill 含 /office-hours、/landing 等，把他每周写 10K+ 行的工作流公开） | [garrytan](https://github.com/garrytan/gstack) |
| opc-skills | Solopreneur 工具集 | ReScienceLab/opc-skills（10 skill 跨资产生成 / 调研增长 / Meta；详见 §5、§7） | [ReScienceLab](https://github.com/ReScienceLab/opc-skills) |

### 10.2 Bootstrapped CFO / 财务管理

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| charlie-cfo-skill + working + driver-based | Charlie Munger 风格 CFO | EveryInc/charlie-cfo-skill：mental model（profit 是约束不是目标）+ 单位经济（LTV ≥ 3× CAC、payback < 12 月）+ 现金管理（24-36 月 runway、Burn Multiple、Rule of 40）+ 资本配置（招聘 ROI 4 问、不要单部门 >50% 扩张）+ working capital（CCC、AR/AP discipline、年付 prepay = 0% 融资）+ driver-based forecast 三方案（base / -15-20% / -30-40%）+ \$3-5M ARR spending benchmarks | [EveryInc](https://github.com/EveryInc/charlie-cfo-skill) |

### 10.3 会计 / 税务 / 跨国合规

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| openaccountants + integrations + intelligence + patterns | 多国会计 / 税务超大库（11 领域） | openaccountants（716 skill 跨 134 国 + 51 美国州 + 13 加拿大省）：tax 各国所得税 / VAT / GST 税率与申报；bookkeeping 各国 chart of accounts / P&L 格式；e-invoicing 各国电子发票 mandatory fields / 传输格式；payroll PAYE / 社保 / 工资单格式；company-formation 实体类型 / 注册步骤 / 成本；financial-statements 年度账目 / 报告框架 / 审计阈值；transfer-pricing TP 文档 / 公平定价 / CbCR；tax-optimization 合法扣除 / 时机策略 / 实体结构；crypto-tax 加密资产税务；cross-border 跨境 / Pillar Two / DAC7；verticals + integrations（Xero/Stripe/PayPal/QBO 平台导出）+ intelligence + patterns | [openaccountants](https://github.com/openaccountants/openaccountants) |

---

## 十一、学术 / 科研 / 长跑研究

### 11.1 学术写作全流程

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| academic-research-skills | 学术研究流水线 | imbad0202/academic-research-skills（research → write → review → revise → finalize 全流程；同作者另有 Codex 版 -codex 仓库） | [imbad0202](https://github.com/imbad0202/academic-research-skills) |

### 11.2 科研 / 工程 / 分析

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| scientific-agent-skills | Scientific Agent skill 集 | K-Dense-AI/scientific-agent-skills（旧名 claude-scientific-skills）：给科研 / 工程 / 分析 / 金融 / 写作的 agent skill 集；含 literature-review 等多个 skill，背后串了 50+ 开源科研项目 | [K-Dense-AI](https://github.com/K-Dense-AI/scientific-agent-skills) |

---

## 十二、Agent 架构 / Context Engineering

### 12.1 Context 概念基础

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| context-fundamentals | Context Engineering 地基课 | muratcankoylan context-fundamentals（解释 context 是什么 / context window 解剖 / attention 机制 / U 形 attention 曲线 / 四大原则：informativity / position-aware / progressive disclosure / iterative curation；明确把所有相邻 skill 的路由关系声明清楚） | [muratcankoylan](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) |

### 12.2 Context 生命周期管理

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| context-degradation + context-optimization + context-compression + filesystem-context | Context 生命周期 4 件套 ⛓ | muratcankoylan context-degradation（5 种可观测 degradation 模式：lost-in-middle / poisoning / distraction / confusion / clash 各给 detection signals + mitigation）+ context-optimization（Token 效率 4 把刀按优先级排：KV-cache > observation masking > 70% 压缩阈值 > context partitioning ≥60% 才考虑切多 agent）+ context-compression（长会话压缩 3 策略：Anchored Iterative Summarization / Opaque Compression / Regenerative Full Summary，目标是 tokens-per-task）+ filesystem-context（把文件系统当 context 的"溢出层"治 4 类失败模式：missing/under-retrieved/over-retrieved/buried） | [muratcankoylan](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) |

### 12.3 Agent 记忆系统

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| memory-systems | 持久语义记忆框架选型 | muratcankoylan memory-systems（4 框架对比：Mem0 向量+图 / Zep+Graphiti 双时态知识图 / Letta 自编辑分层 / Cognee 多层语义图 ECL pipeline + LoCoMo / LongMemEval / DMR / MemBench 基准） | [muratcankoylan](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) |
| latent-briefing | KV cache 表征级共享 | muratcankoylan latent-briefing（多 agent 在 KV cache 表征层共享记忆而不是文本摘要：Attention Matching + 任务条件 query + 共享 head mask + median+tau·MAD 阈值） | [muratcankoylan](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) |
| bdi-mental-states | BDI 心智状态 | muratcankoylan bdi-mental-states（把 RDF 上下文转成 Belief/Desire/Intention 心智状态：endurant 持久状态 vs perdurant 变迁过程，用 motivates / fulfils 串成认知链；面向 SEMAS / JADE / JADEX / LAG 神经符号架构） | [muratcankoylan](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) |

### 12.4 多 agent 拓扑 / 远端 sandbox / Harness

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| multi-agent-patterns | 多 agent 拓扑选型 | muratcankoylan multi-agent-patterns（三种拓扑：Supervisor / 对等 swarm / Hierarchical 选型；显式 handoff 协议 + 防 sycophancy 共识 + 错误级联防护；强调"sub-agent 是为了隔离 context 而不是模拟组织角色"） | [muratcankoylan](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) |
| hosted-agents | 远端 sandbox agent 运行时 | muratcankoylan hosted-agents（agent 跑在远端 sandbox：Modal / Cloudflare DO 风格；image registry 30 分钟预热 + warm pool + session 持久化 + multi-端共享 + self-spawning sub-agent） | [muratcankoylan](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) |
| harness-engineering | 自主 loop 控制平面 | muratcankoylan harness-engineering（自主 agent loop 的 4 类 surface：Locked / Editable / Append-only / Human-controlled + novelty gate + ablation + pruning + rollback + durable log + PR 提交边界，参考 Karpathy autoresearch / AlphaEvolve / FunSearch） | [muratcankoylan](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) |

### 12.5 Tool / 评测 / 项目级方法论

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| tool-design | Tool 设计 | muratcankoylan tool-design（description 当 prompt 而不是文档 + consolidation 原则 + 命名空间 db_*/web_* + 可恢复 error + MCP 适配；配 Vercel d0 砍 80% 工具案例） | [muratcankoylan](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) |
| evaluation | Agent 评测 | muratcankoylan evaluation（outcome over path + 多维 rubric：factual / completeness / citation / source / tool efficiency；先确定性检查再 LLM judge；性能方差三大主因：token 预算 / 工具调用次数 / 模型选择，参考 BrowseComp） | [muratcankoylan](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) |
| advanced-evaluation | 进阶 LLM-as-judge | muratcankoylan advanced-evaluation（Direct Scoring vs Pairwise；偏置 landscape：position / length / self-enhancement / verbosity 各自缓解；G-Eval / MT-Bench 方法） | [muratcankoylan](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) |
| project-development | 项目级方法论 | muratcankoylan project-development（先做 task-model fit 决定该不该上 LLM；5 段式 pipeline：acquire → prepare → process → parse → render；token + 美元成本估算；single vs multi-agent 取舍；配 Karpathy HN Capsule / Vercel d0 / Manus 案例） | [muratcankoylan](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) |

---

## 十三、元能力 / Skill 治理

### 13.1 写 Skill / 创建 Skill

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| skill-creator + writing-skills + write-a-skill | Skill 创建器 | Anthropic skill-creator（起草 → 写测例 → 跑 eval-viewer → 比较 → 重写；带 generate_review.py / agents/grader.md / references/schemas.md）+ Codex skill-creator（教写 SKILL.md + quick_validate）+ superpowers writing-skills（创建符合最佳实践的新 skill 含测试方法）+ mattpocock write-a-skill | [Anthropic](https://github.com/anthropics/skills) · [Codex](https://github.com/openai/skills) · [superpowers](https://github.com/obra/superpowers) · [mattpocock](https://github.com/mattpocock/skills) |

### 13.2 安装 / 发现 / 打包

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| skill-installer + skills | Skill 安装 / 发现 | Codex skill-installer（把 curated skill 装到 \$CODEX_HOME/skills）+ vercel-labs/skills find-skills（npx skills 工具自带：Claude 主动到开放 skill 生态找匹配主题 skill 并装上；shadowing 规则浅层 SKILL.md 覆盖嵌套同名） | [Codex](https://github.com/openai/skills) |
| plugin-creator + cli-creator | Plugin / CLI 打包 | Codex plugin-creator（脚手架 plugin 目录 + marketplace.json）+ Codex cli-creator（按 API 选 Rust/TS/Python 建 stable-JSON 输出 + 配套 skill） | [Codex](https://github.com/openai/skills) |
| migrate-to-codex | 跨 agent 迁移 | Codex migrate-to-codex（把 Claude Code 的 instructions / skills / agents / MCP / hooks 迁到 Codex） | [Codex](https://github.com/openai/skills) |

### 13.3 Skill 安全审计

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| openclaw-skills-security | 装前安全门 ⛓ | UseAI-pro/openclaw-skills-security（skill-vetter + skill-auditor）：装 OpenClaw / Claude skill 之前先做安全审计；分析 metadata、权限范围、代码内容是否有恶意行为；类似 npm audit 但针对 skill | [UseAI-pro](https://github.com/UseAI-pro/openclaw-skills-security) |

### 13.4 Plugin Marketplace

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| claude-plugins-official | Anthropic 官方 Marketplace | anthropics/claude-plugins-official（28+ 个 Anthropic 自营高质量 plugin；/plugin install <name>@claude-plugins-official）；同体系还有 anthropics/claude-plugins-community（社区版）和 knowledge-work-plugins（角色化） | [anthropics-marketplace](https://github.com/anthropics/claude-plugins-official) |

### 13.5 行为约束模板

| Skill 名称 | 分组 | 描述 / 功能介绍 | 源仓库 |
|---|---|---|---|
| andrej-karpathy-skills | CLAUDE.md 模板 | multica-ai/andrej-karpathy-skills（仓库里只有一个 CLAUDE.md 文件——把 Karpathy 在 X 上发的 4 条编程行为约束固化成 prompt；技术上不是 Agent Skill 而是 CLAUDE.md prompt 模板） | [multica-ai](https://github.com/multica-ai/andrej-karpathy-skills) |

---

## 总览统计

| 大类 | 子分组数 | 主要内容 |
|---|---:|---|
| 一、软件开发与工程 | 8 | 计划/SDD、TDD/调试、Code Review/重构、Git/PR、部署、API/SDK/MCP、.NET/桌面、安全 |
| 二、文档与知识管理 | 6 | Office、翻译、写作打磨、NotebookLM/知识图谱、Notion、跨 session 记忆 |
| 三、产品管理（PM） | 11 | 用户研究、问题框定、产品发现、战略、GTM、PRD、优先级、SaaS 健康、OKR/Sprint、发布、PM 元能力 |
| 四、营销 / 增长 / 销售 | 12 | SEO、文案、分发、广告、CRO、潜客、Hook、竞品、销售辅助、定价、GTM、SOP/测量 |
| 五、设计 / 视觉 / 前端 | 8 | 品牌系统、前端规范、UI artifact、Figma、演示、开源设计包、创意艺术、截图多媒体 |
| 六、媒体生产 | 2 | 视频剪辑生成、音频 TTS/转写 |
| 七、数据 / 抓取 / 情报 | 4 | 网页抓取、社交趋势、SQL/数据库、Notebook 分析 |
| 八、求职 / 个人办公 | 3 | 简历/Cover Letter/LinkedIn、面试谈判流水线、个人法律文档 |
| 九、通信 / 工具集成 | 4 | IM 集成、项目管理、桌面 agent 编排、Sleep-time 自治 |
| 十、创业 / 财务 / 合规 | 3 | 创业 toolkit、Bootstrapped CFO、会计税务跨国合规 |
| 十一、学术 / 科研 / 长跑研究 | 2 | 学术写作流水线、Scientific Agent skill 集 |
| 十二、Agent 架构 / Context Engineering | 5 | 概念基础、Context 生命周期、记忆系统、多 agent/sandbox/harness、tool 设计/评测/方法论 |
| 十三、元能力 / Skill 治理 | 5 | 创建、安装/发现/打包、安全审计、Plugin Marketplace、行为约束模板 |
| **合计** | **73 子分组** | **约 95 行表格 / 跨所有原始 skill 来源整合** |

### 强绑定 ⛓ 工作流清单（功能维度共 18 套）

1. § 1.1：核心开发工作流（superpowers 5 件套）
2. § 1.2：Web 应用 UI 测试（Anthropic + ComposioHQ）
3. § 1.3：Code Review 双向（requesting + receiving）
4. § 1.4：GitHub 三件套（gh-address-comments + gh-fix-ci + yeet）
5. § 1.6：Gemini API 三件套
6. § 1.6：OpenAI 平台开发（chatgpt-apps 强制依赖 openai-docs）
7. § 1.7：Microsoft / .NET 栈（aspnet-core + winui-app）
8. § 2.1：—（Office 不强绑定）
9. § 2.4：Obsidian 学习金库（tutor-setup + tutor）
10. § 2.5：Notion 4 联工作流
11. § 4.2：文案三件套（copywriting + copy-editing + marketing-psychology）
12. § 5.1：品牌视觉三件套（brand-guidelines + theme-factory + canvas-design）
13. § 5.4：Figma 8 件套
14. § 5.7：Logo / Banner 生成（依赖 nanobanana）
15. § 5.8：动画 sprite hatch-pet 依赖 imagegen
16. § 7.1：Firecrawl 抓取流水线 5 件套
17. § 7.2：domain-hunter 依赖 twitter + reddit
18. § 9.1：WhatsApp 三件套
19. § 12.2：Context 生命周期 4 件套
20. § 13.3：Skill 装前安全门（skill-vetter + skill-auditor）
