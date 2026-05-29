# skills调研

# 来源

主要分为agent框架自己设计的，专用工具自己设计的，开源社区总结的

## 1 claude code

从claude官方github仓库中找的：[skills/skills at main · anthropics/skills](https://github.com/anthropics/skills/tree/main/skills)

#	Skill	领域	一句话定位	触发场景	关键技术栈 / 依赖	输出 / 产物
1	algorithmic-art	创意/生成艺术	用 p5.js 生成"算法哲学"驱动的生成艺术（noise field、粒子系统等）	用户要求 "generative art / algorithmic art / flow field"	p5.js + 自带 viewer.html 模板 + Anthropic 品牌样式	.md（哲学）+ .html（交互观察器）+ .js（算法）
2	brand-guidelines	设计/品牌	把 Anthropic 官方品牌色 + 字体（Poppins/Lora）应用到任何 artifact	涉及"corporate identity / brand colors / 公司视觉规范"	内置色板（dark #141413、orange #d97757 等）+ python-pptx	任意被风格化的 artifact
3	canvas-design	创意/平面设计	先创作"视觉设计哲学"再表达成博物馆/杂志级 PNG/PDF 海报	"做一张海报 / poster / 平面设计"	自带 canvas-fonts/ 字体库；PNG/PDF 渲染	.md + 单页 .pdf 或 .png
4	claude-api	开发/SDK	使用官方 Anthropic SDK 构建/调试/迁移 Claude API 应用，强制启用 prompt caching、adaptive thinking 等最佳实践	项目中出现 anthropic / @anthropic-ai/sdk，或要求模型迁移 4.5→4.6→4.7	官方 SDK（Python/TS/Java/Go/Ruby/C#/PHP），并按语言拆 python/、typescript/、shared/ 子目录	修改后的代码
5	doc-coauthoring	写作/协作	引导用户走"上下文采集 → 迭代结构 → 读者测试"三阶段共写文档（PRD、RFC、设计文档）	"写 PRD / 写 spec / 起草 RFC / 写 decision doc"	纯流程指令，无外部依赖	协作完成的文档
6	docx	文档处理	Word 文件的读、改、生成（含 letterhead、目录、追踪修订、图片插入）	提到 .docx / Word doc / report / memo / letter / template	pandoc（读）+ docx-js（创建）+ unpack/repack XML（编辑）+ LibreOffice（PDF 预览）	.docx
7	frontend-design	前端 UI	让 Claude 跳出"AI slop"，做出具备明确美学方向（极简/野兽/复古未来主义等）的生产级前端 UI	要求构建网页、组件、海报、应用 UI	HTML/CSS/JS、React、Vue、Motion 库；强烈反对 Inter/Roboto/紫色渐变	可运行的前端代码
8	internal-comms	企业沟通	写各类内部通讯（3P 进度、公司 newsletter、FAQ、leadership update、incident report）	"周报 / status / 3P / company comms / FAQ"	子目录 examples/3p-updates.md 等模板	Markdown 沟通文本
9	mcp-builder	开发/Agent 协议	四阶段方法论（研究 → 实现 → 测试 → 评估）构建高质量 MCP Server	给某 API 写 MCP Server	TypeScript MCP SDK（默认）/ Python FastMCP；MCP Inspector；Zod / Pydantic	完整 MCP Server 项目 + 10 个 eval QA 对
10	pdf	文档处理	PDF 读取/抽取/合并/拆分/旋转/水印/加密/表单填写/OCR	提到 .pdf 或要生成 PDF	pypdf、pdfplumber、reportlab、qpdf、pdftk、pytesseract + pdf2image	.pdf
11	pptx	文档处理	演示文稿读/编辑/创建（含模板、布局、备注、QA），并附带 10 套配色 + 字体配对 + 视觉规则	提到 deck / slides / presentation / .pptx	markitdown、pptxgenjs、LibreOffice、pdftoppm，并强制用 subagent 做视觉 QA	.pptx
12	skill-creator	元能力	创建/迭代/评测 skill 自身：起草 → 写测例 → 跑 eval-viewer → 比较 → 重写	"做一个 skill / 优化 skill / 给 skill 跑 benchmark"	自带 eval-viewer/generate_review.py、agents/grader.md 等子 agent 与 references/schemas.md	新的或改进的 skill 包
13	slack-gif-creator	创意/动效	生成符合 Slack 限制（128×128 emoji 或 480×480、≤2MB）的动画 GIF	"make me a GIF for Slack of X doing Y"	PIL/Pillow + imageio + 自带 core.gif_builder / validators / easing	.gif
14	theme-factory	设计/主题	10 个预设主题（Ocean Depths / Sunset Boulevard / Modern Minimalist / Tech Innovation 等）的字体+配色，可应用到任何 artifact，也可即兴生成新主题	给 slide / doc / landing page 套统一风格	themes/ 目录 + theme-showcase.pdf 展示	被风格化后的 artifact
15	web-artifacts-builder	前端工程	用 React 18 + TS + Vite + Tailwind + shadcn/ui 构建复杂 Claude.ai 单文件 HTML artifact，最后用 Parcel + html-inline 打包	复杂多组件 artifact（路由、状态管理、shadcn 组件）	scripts/init-artifact.sh、scripts/bundle-artifact.sh；40+ shadcn 组件预装	单个自包含的 bundle.html
16	webapp-testing	QA/自动化	用 Playwright 测试本地 Web 应用、抓 console 日志、做 DOM 侦察	"测一下我本地的 web 应用 / 验证前端功能 / 截图调试"	Python Playwright + 自带 scripts/with_server.py（服务生命周期管理）	Playwright 脚本 + 截图/日志
17	xlsx	文档处理/财务	读、写、清洗、修复 Excel/CSV/TSV，并强制金融建模色彩规范（蓝输入/黑公式/绿跨表/红外链）与零公式错误	提到 spreadsheet / xlsx / xlsm / 财务模型 / 数据清洗	openpyxl（格式/公式）+ pandas（分析）+ 自带 scripts/recalc.py	.xlsx

## 2 codex

#	Skill	领域	描述 / 功能	触发场景	关键技术栈 / 依赖	输出 / 产物
1	cloudflare-deploy	部署	用决策树覆盖 Cloudflare 全栈（Workers、Pages、D1、R2、KV、Queues、Workers AI、Vectorize、WAF 等 60+ 产品），按"我要计算/存储/AI/网络/安全/媒体"分流到对应 reference	部署、托管、发布、设置 Cloudflare 项目	wrangler CLI（含 wrangler whoami 鉴权预检）；按需 IaC（Pulumi/Terraform）；多 reference 子文件	Cloudflare 产品代码 + 部署
2	netlify-deploy	部署	用 npx netlify CLI 自动化 Netlify 部署：检测鉴权、按 Git remote 自动 link 站点或 netlify init 新建、智能识别框架默认 build/publish 配置	部署、host、publish、link 站点到 Netlify	npx netlify；浏览器 OAuth 或 NETLIFY_AUTH_TOKEN；自动识 Next/Vite/静态 HTML	preview / production 部署 URL
3	render-deploy	部署	在 Render 上做 Git-backed 部署：分析代码、生成 render.yaml Blueprint 或通过 MCP 工具直接创建服务、提供 Dashboard deeplink	部署到 Render；建数据库/cron job/静态站	render MCP 工具；render.yaml Blueprint；prebuilt Docker image 走 Dashboard	render.yaml + 部署
4	vercel-deploy	部署	用 vercel deploy 把项目推到 Vercel，默认 preview（除非用户显式要 production）；CLI 不可用时降级到捆绑的 deploy script	"deploy my app"、"push live"、"create preview"	vercel CLI（10 分钟 timeout）；fallback 走 scripts/deploy.sh 拿 previewUrl + claimUrl	部署 URL
5	aspnet-core	后端框架	按 .NET 10 / ASP.NET Core 10 当前官方实践写代码：Blazor / Razor Pages / MVC / Minimal APIs / 控制器 Web API、DI、中间件、认证授权、SignalR、gRPC	Blazor、Razor、MVC、Minimal API、ASP.NET 升级、performance	WebApplicationBuilder；ProblemDetails、OpenAPI、Identity、rate limiting、output caching；多 reference 子文件	C# 代码
6	winui-app	Windows 桌面	装 / 改 WinUI 3 + Windows App SDK 桌面应用：自动跑 WinGet 配置装 VS 2026、dotnet new winui 脚手架、强制启动验证（要看到顶层窗口）	创建/审查 WinUI 3 应用、Blazor 包装、Windows 设计	dotnet new winui、bundled config.yaml、CommunityToolkit	C# WinUI 应用
7	pdf	文档处理	读、生成、审 PDF；用 pdftoppm 把页面渲成 PNG 做视觉验收，再用 reportlab/pdfplumber/pypdf 做生成与抽取	涉及 .pdf 的读、写、审	reportlab、pdfplumber、pypdf、Poppler pdftoppm	.pdf
8	jupyter-notebook	数据 / 教学	起 experiment 或 tutorial 两类干净可复现 notebook，避免手写 JSON 出错	写 .ipynb 给实验或教学；改造草稿/脚本成结构化 notebook	bundled scripts/new_notebook.py、assets/*-template.ipynb；可选 uv pip install jupyterlab	.ipynb
9	screenshot	截图	跨 OS 截屏（全屏 / 应用窗口 / 像素区域 / 活动窗口），macOS 有专门的权限预检脚本，Linux 自动选 scrot/gnome-screenshot/import	用户显式要桌面截屏；其他工具截不到时	bundled scripts/take_screenshot.py、take_screenshot.ps1、ensure_macos_permissions.sh	PNG 截图
10	speech	文本转语音	调 OpenAI Audio API 生成单条或批量语音（旁白、IVR、可访问性朗读），默认 gpt-4o-mini-tts-2025-12-15 + 内置音色	配音、解说、IVR 提示音、批量生成	openai SDK、bundled scripts/text_to_speech.py（强制走 CLI、不写一次性脚本）；需 OPENAI_API_KEY	音频文件 + 用过的 prompt 记录
11	transcribe	语音转文本	用 gpt-4o-mini-transcribe 快转或 gpt-4o-transcribe-diarize 带说话人分离；支持 known-speaker 参考样本	转写音频、提取录音文本、给会议/访谈打 speaker 标签	bundled scripts/transcribe_diarize.py；OPENAI_API_KEY；uv pip install openai	文本 / diarized JSON
12	imagegen	图像生成	默认走 Codex 内置 image_gen 工具（无需 API key）；只有用户明确要才降级到 CLI；强制把图保存到 workspace 而非临时目录	生成或编辑位图（照片、UI mockup、贴图、sprite、透明抠图）	内置 image_gen 工具；fallback scripts/image_gen.py（需 OPENAI_API_KEY）	位图（PNG/WebP）
13	hatch-pet	创意 / 动画	端到端造一个 Codex 兼容的动画宠物：8×9 spritesheet、品牌探索、按 8 种状态分行生成、QA contact sheet、motion preview、最后打包成 pet.json + spritesheet	用户要做"工作 pet"、品牌 mascot、prospect 宠物	$imagegen 子 skill 调用；bundled 多 reference + script；要求 1536×1872 atlas	pet.json + spritesheet.webp
14	notion-knowledge-capture	知识沉淀	把对话/笔记按数据库 schema 转成结构化 Notion 页（决策、how-to、FAQ、wiki、学习记录）	把聊天/讨论变成可复用的 Notion 文档	Notion MCP（notion-search / notion-fetch / notion-create-pages / notion-update-page）	Notion 页面
15	notion-meeting-intelligence	会议准备	拉历史 Notion 上下文 + Codex research，生成 agenda / pre-read，按状态/决策/计划/retro/1:1/头脑风暴 6 种模板挑一个	准备会议、起 agenda、定 timebox/owner	Notion MCP；bundled reference/template-selection-guide.md 等模板	Notion 会议页
16	notion-research-documentation	研究综述	在多份 Notion 页之间交叉检索、综述并按 quick brief / summary / comparison / comprehensive 模板出报告，强制带 citations	多源调研、竞品对比、技术深挖、出 brief	Notion MCP；bundled 模板 + citations.md 规范	带引用的 Notion 报告
17	notion-spec-to-implementation	规划	把 Notion spec 解析成实现计划页 + 任务库条目，并把 spec ↔ plan ↔ tasks 互相关联	实现 PRD / spec；建实施任务跟进	Notion MCP；bundled spec parsing 与 task 模板	计划页 + 任务库条目
18	linear	项目管理	通过 Linear MCP 管 issue / project / cycle / label：sprint plan、bug triage、文档审计、负载均衡、release plan、retro	用户要读、改、建 Linear ticket	Linear MCP（OAuth）；list_issues、create_issue、list_projects、list_cycles 等	Linear issue / project / comment
19	gh-address-comments	GitHub 协作	用 gh 拉当前分支 PR 的 review thread / comment，编号让用户挑哪些要修，然后改代码	处理 PR 上的 review comment	gh CLI；bundled scripts/fetch_comments.py	修复后的代码改动
20	gh-fix-ci	GitHub 协作	定位失败的 PR 检查（仅限 GitHub Actions），抓 run/job 日志，截一段失败片段，先出 plan 再改代码	修挂掉的 CI / Actions check	gh CLI；bundled scripts/inspect_pr_checks.py	CI 修复改动
21	yeet	GitHub 协作	一气呵成 stage → commit → push → 开 draft PR，自动发现 PR 模板并填好 title/body（按 <type>(<scope>): <subject>）	用户要"快速发 PR"	git、gh CLI；.github/pull_request_template*.md	PR
22	figma	Figma 入口	Figma MCP 集成总规则：先 get_design_context → 看不下再 get_metadata → get_screenshot 看视觉 → 再实现	涉及 Figma URL / node ID / design-to-code	Figma MCP；React + Tailwind 作为中间表示	实现代码
23	figma-use	Figma Plugin API	使用 use_figma MCP 的强制前置 skill——给 Plugin API 调用列硬规则（return 而不是 figma.notify、字体先 loadFontAsync、color 0–1 范围、变量 scope 必填等）	任何 use_figma 调用前	bundled Plugin API 类型定义 + 多个 patterns reference	Figma 文件里的程序化改动
24	figma-create-new-file	Figma 文件管理	调 create_new_file MCP 在用户 drafts 下建空白 design 或 FigJam 文件；先 whoami 解析 planKey	新建 Figma 文件	Figma MCP；whoami + create_new_file	新文件 fileKey/URL
25	figma-generate-design	Design ⇒ Figma	把代码或描述里的整页 / 整屏译成 Figma 屏：用 search_design_system 找已发布组件 + tokens，逐 section 装配，避免"画方块写 hex"	把 app 页面、landing page 推回 Figma	Figma MCP（含 search_design_system、generate_figma_design）；与 figma-use 配合	Figma 屏
26	figma-generate-library	设计系统	从代码库反向"造"专业设计系统：discovery → tokens（primitives + semantic + scopes + code syntax）→ 文档页 → 组件 → 验证；20–100+ 次 API 调用强制分阶段做	在 Figma 里建/升级 design system	Figma MCP；多 reference + 9 个 helper script	完整 Figma 设计系统
27	figma-implement-design	Figma ⇒ 代码	把 Figma 节点译为 1:1 像素级生产代码，强制 reuse 项目设计 token 与组件，验收时再回 Figma 比 screenshot	给定 Figma URL / node 实现产品代码	Figma MCP；项目设计系统；React/CSS-in-X	1:1 还原代码
28	figma-code-connect-components	Code Connect	跑 get_code_connect_suggestions + send_code_connect_mappings，把 Figma 已发布组件和代码组件互相绑定（仅 Org/Enterprise 计划）	建 Figma ↔ 代码组件映射	Figma MCP；要求 node-id 参数；published team library	Code Connect 映射
29	figma-create-design-system-rules	Figma 规则	给项目生成 CLAUDE.md / AGENTS.md / .cursor/rules/...，把"组件该放哪、哪些值不能硬编码、设计 token 怎么用"写成 agent rule	给项目装 Figma-to-code 规则	Figma MCP；按 agent 适配 rule 文件	项目根的 rule 文件
30	playwright	CLI 浏览器自动化	用 playwright-cli 在终端开真实浏览器：snapshot 拿稳定 ref → click/type/fill → 必要时再 snapshot；不主动写 @playwright/test spec	终端里跑导航/填表/截图/数据抽取	bundled scripts/playwright_cli.sh（走 npx --package @playwright/cli）	截图 / PDF / trace
31	playwright-interactive	浏览器持久会话	通过 js_repl 维持 Playwright/Electron 会话，做 UI 迭代调试 + 视觉 QA，会话不重启；要求 sandbox danger-full-access	反复调试本地 web/Electron 应用	js_repl、playwright、可选 electron；强制先列 QA inventory	调试结果 + 截图
32	security-best-practices	安全审查	识别项目语言/框架，加载对应 <lang>-<framework>-<stack>-security.md reference，写 secure-by-default 代码、被动检漏或出报告 + 修复	用户显式要求安全审查/最佳实践（仅 py/js/ts/go）	bundled 各语言 reference；输出 security_best_practices_report.md	修复 + 报告
33	security-threat-model	威胁建模	基于仓库证据做 AppSec 级威胁建模：scope → 信任边界/asset/entry → 攻击者能力 → abuse path → 严重度 → 既有 vs 推荐缓解 → 写 <repo>-threat-model.md	显式要"做 threat model"	bundled references/prompt-template.md 输出契约；强制提问澄清关键假设	仓库专属 threat model md
34	security-ownership-map	安全运维	从 git history 建"人 ↔ 文件"二部图，算 bus factor、敏感代码的孤儿状况、co-change 聚类、社区 maintainer，导出 CSV/JSON 给 Neo4j/Gephi	安全负责人想看"谁在动 auth/crypto"、孤儿敏感代码、ownership 漂移	Python 3 + networkx；bundled run_ownership_map.py + query_ownership.py	CSV/JSON/graphml + summary.json
35	sentry	错误监控	用 sentry CLI 只读地查 issue / event / health：list、view、events、issue explain（AI 根因）、issue plan（AI 修复方案），自动检测 org/project	看生产错误、issue 概况、errors 健康度	sentry CLI、SENTRY_AUTH_TOKEN；输出 PII 自脱敏	issue 摘要 / 根因分析
36	chatgpt-apps	OpenAI 平台开发	用 docs-first 流程脚手架 ChatGPT Apps SDK 应用：archetype 分类 → tool plan → 选 starter（官方示例 / ext-apps / fallback）→ 出 MCP server + widget UI 扫骨架 → 验证最小可工作仓库	建 ChatGPT Apps（MCP server + widget）	$openai-docs skill / OpenAI docs MCP 必先；@modelcontextprotocol/ext-apps	Apps SDK 项目脚手架
37	openai-docs	官方文档	用 developers.openai.com 的 MCP 工具优先（search_openai_docs / fetch_openai_doc）查 OpenAI 文档；负责模型选型、模型字符串升级、prompt 升级	任何"用 OpenAI API 怎么做"、模型升级 / 选最新模型	OpenAI Developer Docs MCP；fallback bundled references/latest-model.md 等；scripts/resolve-latest-model-info.js	带引用的回答 / 升级 diff
38	define-goal	Agent 控制	把模糊意图改写成"具体可验证目标"：先 get_goal，没有就 create_goal；强制写出 outcome、artifact、verification、scope、stop condition、quantitative 阈值	用户要 $define-goal、setting goal、明确成功标准	get_goal / create_goal 工具；多个 quality 范例	一个干净的 goal
39	migrate-to-codex	工具迁移	把 Claude Code 的 instructions / skills / agents / MCP 配置 / hooks 迁到 Codex（项目和全局），用 dry-run + doctor + validate-target 自愈循环	把项目从 Claude 迁到 Codex	bundled scripts/migrate-to-codex.py；最终输出迁移报告表	AGENTS.md、.codex/、.agents/ 等
40	cli-creator	元能力	给 Codex 做"可重用 CLI"——根据 API 文档/OpenAPI/SDK/curl/web app 选 Rust/TS/Python，建 stable-JSON 输出的 CLI 并配一个 companion skill	用户要把工作流固化成 ~/.local/bin/<tool>	cargo/pnpm/uv 任一；$skill-creator 配套使用	一个真实可装的 CLI + 配套 skill
41	skill-creator	元能力 / 自举	"造 skill 的 skill"：教怎么写有效的 SKILL.md（concise、合理 degrees of freedom、frontmatter 规范），并跑 scripts/quick_validate.py 校验；.system/ 下预装	用户要新建或迭代 skill	bundled scripts/quick_validate.py、references	一个新的或更新过的 skill 文件夹
42	skill-installer	元能力 / 安装	把 curated skill 装到 $CODEX_HOME/skills：可列清单（.curated 或 .experimental）、按名安装、从任意 GitHub repo（含私有）拉 skill；.system/ 下预装	用户问"有哪些 skill 可装" / "装这个 skill"	bundled scripts/list-skills.py、scripts/install-skill-from-github.py；可选 GITHUB_TOKEN	装到本地的 skill
43	plugin-creator	元能力 / 打包	脚手架 Codex plugin 目录（.codex-plugin/plugin.json 必备，可选 skills/hooks/scripts/assets/MCP/apps），并维护 repo 根的 .agents/plugins/marketplace.json 顺序与 policy（installation/authentication/category）	建本地 plugin / 加 marketplace 条目	bundled scripts/create_basic_plugin.py；references/plugin-json-spec.md	plugin 目录 + marketplace.json 条目

## 3 Gemini

#	Skill	领域	描述 / 功能	触发场景	关键技术栈 / 依赖	输出 / 产物
1	gemini-api-dev	开发/SDK	用统一 Gen AI SDK 直连 Gemini API，处理文本/多模态/function calling/structured output，并强制使用 3.x 模型与新版 SDK	构建调用 Gemini 或 Gemma 4 的应用；查询当前模型规格	google-genai（Py）、@google/genai（JS/TS）、google.golang.org/genai（Go）、com.google.genai:google-genai（Java）；优先 MCP search_docs，fallback llms.txt	调用 Gemini API 的代码（Py/TS/Go/Java）
2	gemini-live-api-dev	开发/实时音视频	用 WebSocket 构建低延迟双向语音/视频/文本流，覆盖 VAD、native audio thinking、session 管理、ephemeral token 鉴权	实时对话/通话；屏幕或摄像头流；浏览器/移动端实时鉴权	仅 gemini-3.1-flash-live-preview；google-genai / @google/genai；只支持 WebSocket，要 WebRTC 走合作方	实时双向流式应用代码
3	gemini-interactions-api	开发/Agent 协议	调用 Gemini 模型与 Agents 的新版 Interactions API，替代旧 generateContent，并处理 2026-05 的 schema breaking change 迁移	多轮 chat、流式、function calling、图像生成、Deep Research/Antigravity Agent；从旧 API 迁移	google-genai >= 2.0.0 / @google/genai >= 2.0.0；新 steps + 多态 response_format；流式事件 step.start/delta/stop 等	Interactions API 调用代码 + 旧→新 schema 迁移

## 4 Firecrawl

#	Skill	领域	描述 / 功能	触发场景	关键技术栈 / 依赖	输出 / 产物
1	firecrawl-build	Web 数据集成	入口 skill，把任务路由到 /scrape、/search、/interact 三个窄端点	应用需要 web 搜索/抓取/抽取/浏览器交互，甚至用户没明说 Firecrawl	6 个 reference 子文件 + docs.firecrawl.dev/agent-source-of-truth 真相源	集成代码 + smoke test
2	firecrawl-build-onboarding	凭据 / 项目初始化	装 SDK、跑浏览器授权、把 FIRECRAWL_API_KEY 写进 .env，跑通第一次调用	项目首次集成 Firecrawl；要写 env；要选 SDK	3 个 reference（auth-flow / sdk-installation / project-setup）；npx firecrawl-cli init --all --browser	.env + 装好的 SDK + 第一次成功调用
3	firecrawl-build-scrape	单页抽取	已知 URL 时调 /scrape 拿 markdown / HTML / 链接 / 截图 / 结构化字段	已有 URL；做知识入库、富化、抓 pricing/changelog/文档页	/scrape 端点 + 各语言 SDK；默认 markdown + onlyMainContent	单页抽取代码
4	firecrawl-build-search	查询发现	从 query 起步调 /search 找候选页，可选 hydrate 成完整内容	从问题/关键词出发；带引用的回答；竞品/主题发现	/search 端点 + 各语言 SDK；常组合 /search → /scrape	query → 结构化结果代码
5	firecrawl-build-interact	多步浏览器交互	调 /interact 处理点击、填表、分页、登录后访问等 /scrape 搞不定的动态页	内容要点击/输入后才出现；登录态后台；分页结果集	/interact 端点 + 各语言 SDK；先 /scrape 再升级	多步浏览器流程代码

## 5 Corey Haines（for marketing）

#	Skill	领域	描述 / 功能	触发场景	输出 / 产物
1	seo-audit	技术 + on-page SEO	用一套审计框架诊断 SEO 健康度（技术、on-page、内容、移动、Core Web Vitals、indexing、爬错），给优先级清单	"SEO 审计 / 不排名 / 流量掉了 / page speed / crawl errors"	优先级 SEO 审计报告
2	ai-seo	答案引擎优化	优化让内容被 AI Overviews / ChatGPT / Perplexity / Claude / Gemini / Copilot 引用：内容结构、citable 数据、schema 配合、AEO/GEO/LLMO 策略	"AI SEO / AEO / GEO / LLMO / AI 引用 / AI Overviews"	AI 引用优化清单 + 改造后的内容
3	programmatic-seo	SEO 规模化	12 套 playbook（Templates / Curation / Comparisons / Locations / Personas / Integrations / Glossary / Profiles 等）做 templated 落地页，强调每页有独特价值、避免 thin-content 处罚	"pSEO / 模板页 / 大量页面 / [keyword]+[city] / 比较页 / 集成页"	关键词 pattern 设计 + 模板 + 内链架构
4	schema	结构化数据	为页面加 / 优化 schema.org 标记（Article、FAQ、Product、HowTo、Organization 等），改善 SEO 可读性与 AI 可抽取性	"schema markup / structured data / FAQ schema"	各类 JSON-LD 片段
5	site-architecture	网站结构	规划页面层级、导航、URL 结构、面包屑、内链与 hub-and-spoke 设计	"site architecture / URL 结构 / 导航 / page hierarchy"	站点地图 + URL 规则 + 内链方案
6	content-strategy	内容规划	决定写什么、按 searchable/shareable 分层、做 topic cluster 与 editorial calendar	"content strategy / 写啥 / blog topics / 内容支柱 / editorial calendar"	内容 roadmap + 选题清单
7	directory-submissions	外链 / 曝光	系统提交到 SaaS 与产品目录（Product Hunt 之外的常青目录、本地目录、行业目录），获取外链与流量	"directory submission / 列名录 / SaaS 目录 / backlinks"	目录提交清单 + 提交模板
8	cro	通用 CRO	在任意营销页（首页、落地页、定价、功能页等）上找转化机会，按"现有需求满足 / 阻力消除 / 紧迫感 / 信任"做诊断与改造（覆盖你列表里的 page-cro、popup-cro、form-cro、paywall-upgrade-cro、onboarding-cro、signup-flow-cro，仓库里合并到一个 cro skill）	"CRO / 转化率 / 优化首页 / popup / form / signup flow / paywall / onboarding 转化"	CRO 诊断 + 改写方案 + 优先级测试清单
9	popups	popup / modal / slide-in	设计与优化弹窗、modal、slide-in、exit-intent，含触发时机、文案、表单字段、设备适配	"popup / modal / exit intent / lead magnet 弹窗"	弹窗规格 + 文案 + 触发规则
10	paywalls	付费墙 / 升级页	设计 in-app 升级 modal、paywall、upsell 屏，结合心理学（loss aversion / anchoring）与计划差异化	"paywall / upgrade screen / upsell / trial 到期"	paywall 设计稿 + 文案 + A/B 假设
11	signup	注册 / 激活	优化 signup、注册、试用激活流程，减摩擦、增激活率、改 time-to-value（含你列表里的 signup-flow-cro）	"signup flow / 注册转化 / trial activation"	注册 flow 改造方案
12	onboarding	上手激活	优化 post-signup 上手流程，缩短 time-to-value，绑定激活事件（含你列表里的 onboarding-cro）	"onboarding / 激活 / time-to-value"	onboarding 流程 + 触达节点
13	ab-testing	实验	设计 A/B / split test：写 hypothesis、定 primary / secondary / guardrail metric、算样本量、严控提前 stop（含你列表里的 ab-test-setup）	"A/B test / 实验 / split test / 统计显著 / 实验 backlog / ICE"	实验设计文档 + 样本估算 + 报告模板
14	copywriting	营销文案	写或重写 landing/home/pricing/feature/about 页文案：headline 公式、CTA、特性→收益→结果转化	"写 copy / headline / CTA / value prop / hero"	整页文案 + 备选标题
15	copy-editing	文案打磨	用 7-pass sweeps 框架（clarity / specificity / verbs / cuts / voice / proof / consistency）改现成 copy，不重写	"edit my copy / proofread / tighten / sharpen"	改完的 copy + 改动注释
16	emails	生命周期邮件	起邮件序列、drip、欢迎、win-back、生命周期 flow（含你列表里的 email-sequence）	"email sequence / drip / lifecycle / nurture / win-back"	整套邮件序列 + 触发条件
17	cold-email	B2B 冷启动外联	写人味的 B2B 冷邮件 + 多步 follow-up，主张 observation → problem → proof → ask 等多种 framework，禁用 "leverage / synergy / hope this finds you well"	"cold email / 外联 / SDR / 没人回复 / break-up email"	冷邮件序列 + 主题行 + breakup
18	sms	SMS / iMessage	设计短信营销 / 交易短信 / 短信序列，含合规与发送频率	"SMS / 短信营销 / text message"	短信序列 + cadence
19	social	社媒内容	给 LinkedIn / X / Instagram / TikTok 出 post、calendar、声明（含你列表里的 social-content）	"social post / LinkedIn / Twitter 内容 / 社媒日历"	社媒文案 + 排程
20	video	视频内容	规划视频脚本、shorts、demo 视频、YouTube 内容（仓库新增）	"video script / YouTube / shorts / demo 视频"	脚本 + 视频架构
21	image	图像 / 视觉	出 Marketing 图像 brief：广告 creative、社媒图、博客封面、infographic（仓库新增）	"营销图 / banner / 海报 / 图像 brief"	图像 brief + 视觉指南
22	sales-enablement	销售辅助	出 pitch deck、one-pager、objection handling、demo script、battle card	"sales deck / one-pager / battle card / objection handling"	销售套件
23	ads	付费广告策略	在 Google / Meta / LinkedIn / TikTok / X 做 campaign 策略、人群、bidding、预算、retargeting、ROAS / CPA 优化（=你列表里的 paid-ads）	"PPC / paid media / ROAS / CPA / Google Ads / Facebook Ads"	campaign 计划 + 人群 + 预算
24	ad-creative	广告创意	大批量产 ad headline / description / primary text，含 RSA、bulk 变体、creative testing；可基于平台数据迭代	"ad copy / RSA headlines / bulk ad / creative testing"	多版本广告文案
25	aso	App 商店优化	抓 App Store / Google Play 页面跑评分、关键词、视觉、评论审计，给优先级 action	"ASO 审计 / app store optimization / 安装率 / 排名"	ASO 审计报告
26	referrals	推荐计划	设计客户推荐 / affiliate / WoM 程序，含奖励结构、漏斗、追踪（=你列表里的 referral-program）	"referral / affiliate / 推荐分销"	推荐计划方案
27	launch	发布 GTM	规划产品发布 / 功能发布 / GTM：发布主线、合作伙伴、渠道、resy、PR、PH 等（=你列表里的 launch-strategy）	"launch / GTM / 发版 / Product Hunt"	发布计划 + 资产 + 时间线
28	marketing-ideas	创意头脑风暴	给 SaaS 出 marketing campaign 创意与战术 idea	"marketing ideas / 营销点子 / campaign idea"	创意清单（含 ICE 评估）
29	marketing-psychology	行为 / 心理学	把 first principles、JTBD、social proof、scarcity、loss aversion、anchoring、Cialdini 七原则等 mental model 套到具体营销场景	"psychology / cognitive bias / persuasion / nudge / anchoring / scarcity"	心理学应用清单 + 改写建议
30	co-marketing	合作营销	找 ideal partner、设计 joint campaign、评估 audience overlap（仓库新增）	"co-marketing / 合作 / partner marketing / 联合活动"	合作 partner 清单 + campaign 模板
31	community-marketing	社区运营	设计 / 落地 / 拉伸 Discord / Slack / Reddit / Circle / Discourse 社区，含核心 loop、ambassador、健康指标（仓库新增）	"build community / Discord / Slack / community-led growth / ambassador"	社区策略 + 频道结构 + 仪式日历
32	churn-prevention	留存 / 防流失	设计 cancel flow、save offer、dunning、failed payment recovery、win-back，区分 voluntary vs involuntary	"churn / 退订 / 取消流程 / dunning / 救回失败支付 / win-back"	cancel flow + 救回方案
33	pricing	定价 / 包装	给 SaaS 出 pricing tier、计费模型、年付折扣、grandfather、psychological anchor（=你列表里的 pricing-strategy）	"pricing / packaging / 定价 / 计费模型"	pricing 方案 + 定价页布局
34	revops	收入运营	串 lead lifecycle、scoring、SLA、marketing-to-sales handoff、CRM 字段	"RevOps / lead routing / MQL/SQL / handoff"	RevOps 流程 + CRM schema
35	lead-magnets	引流物	设计 ebook / checklist / 模板 / 报告等 lead magnet，配合落地页与邮件抓取漏斗（仓库新增）	"lead magnet / 引流 / ebook / checklist"	lead magnet 选题 + 落地页结构
36	free-tools	免费工具引流	规划免费工具策略：定题、UX、SEO 价值、转化路径（=你列表里的 free-tool-strategy）	"free tool / 工具引流 / SEO 工具"	free tool 选题 + 漏斗
37	competitors	比较 / 替代页	4 种格式（[Competitor] alternative / alternatives / You vs / A vs B）写 SEO + 销售用比较页（=你列表里的 competitor-alternatives）	"vs page / alternative page / 替代页 / 比较页 / battle card"	比较页文案 + 集中化 competitor 数据
38	competitor-profiling	竞品调研	从一组 URL 起步，结合实页抓取 + SEO + review 数据，产出结构化竞品 profile（仓库新增）	"competitor profile / 竞品研究 / 深度分析 / 战情"	标准化 competitor profile md
39	prospecting	潜客挖掘	建/筛 ICP-fit prospect 名单（行业、tech stack、招聘信号、增长信号等）（仓库新增）	"prospecting / 找潜客 / lead list / ICP"	prospect 名单 + 资格评估
40	customer-research	客户研究	用户访谈、review mining、support ticket 分析，提炼 voice-of-customer 与 JTBD（仓库新增）	"customer research / VOC / JTBD / interview"	客户语言库 + JTBD 报告
41	product-marketing	营销基础上下文	维护 product-marketing.md 单一上下文文档（定位、ICP、声明、差异化、关键 message），其他所有 skill 启动时优先读它（=你列表里的 product-marketing-context）	"product marketing context / 定位 / ICP / messaging"	.agents/product-marketing.md
42	analytics	数据 / 测量	设 GA4 / GTM / Mixpanel / Amplitude / PostHog / Segment 跟踪、写 tracking plan、起 UTM 规范、做 debug（=你列表里的 analytics-tracking）	"GA4 / GTM / 跟踪 / event tracking / UTM / Mixpanel"	tracking plan + 事件命名表 + UTM 规则

## 6 Dean Peters（for PM）

#	Skill	领域	描述 / 功能	触发场景	输出 / 产物
1	acquisition-channel-advisor	增长 / 渠道	用 unit economics 评估渠道（CAC / LTV / payback / 利润），给 scale / test / kill 建议	"渠道决策 / 哪个渠道值得投 / kill 渠道"	渠道分级 + 行动建议
2	ai-shaped-readiness-advisor	AI 战略	在 5 项 competency 上诊断"自动化 vs 重设计" AI 机会	"AI 转型 / 哪些工作能 AI 化"	AI ready 评分 + 改造路径
3	altitude-horizon-framework	领导力	帮 PM→Director 跨越 scope / time horizon / 失败模式的 mindset 转变	"PM 升 Director / 视野不够 / 战略思考"	角色转变 checklist
4	business-health-diagnostic	业务诊断	诊断 SaaS 健康度，列红旗，按修复价值排优先级	"业务有问题 / 找问题 / SaaS 健康检查"	红旗 + 修复优先级清单
5	company-research	调研	对竞品 / 公司做深度分析（产品、定位、财务、市场、客户）	"研究这家公司 / 竞品 deep dive"	标准化公司画像
6	customer-journey-map	用户体验	用 NNGroup 框架画跨触点的客户体验 journey map	"客户旅程 / journey / 触点"	旅程图 + pain point 标注
7	eol-message	沟通	体面地沟通产品 / 功能下线 EOL，含时间表、迁移路径、补偿	"EOL / 下线 / deprecate / sunset"	EOL 通告文案
8	epic-hypothesis	产品规划	把 initiative 改写成可验证 hypothesis（含 success metric）	"把这个 initiative 变成 hypothesis / 假设"	epic-level hypothesis 文档
9	finance-metrics-quickref	财务速查	32+ SaaS 财务指标的公式 + benchmark 速查表	"MRR / ARR / churn / NRR 指标怎么算"	财务指标 cheat sheet
10	jobs-to-be-done	用户研究	用 Christensen / Osterwalder 的 JTBD（功能 / 社会 / 情感 + pains + gains）解构客户雇佣动机	"JTBD / 用户为什么用 / 雇用这个产品"	JTBD 三栏分析
11	pestel-analysis	战略分析	用 Political / Economic / Social / Tech / Environmental / Legal 6 维度分析外部环境	"PESTEL / 外部环境 / 宏观分析"	PESTEL 报告
12	pol-probe	验证实验	设计 lightweight validation 实验 (Proof of Lifelike) 测假设	"怎么验证 / 验证假设 / 轻量实验"	实验设计 + 成功标准
13	positioning-statement	战略定位	用 Geoffrey Moore 框架（For / that need / is a / that / Unlike） 定位声明	"positioning / 定位 / 区分对手"	定位 + 差异化声明
14	press-release	愿景沟通	用 Amazon Working Backwards 写"未来发布稿"，把客户价值想清楚	"press release / Amazon WB / 未来发布稿"	1.5 页 PR + 引用
15	problem-statement	问题框定	用 "I am / Trying to / But / Because / Which makes me feel" 五段式写以用户为中心的问题陈述	"问题陈述 / 框定问题 / 站在用户角度"	问题陈述文档
16	proto-persona	用户研究	在做完整调研前先建假设型 persona	"proto persona / 假设画像 / 还没访谈"	假设型 persona
17	recommendation-canvas	AI 产品	文档化 AI 推荐功能（数据、算法、置信、回退、UX）	"AI 推荐 / 推荐系统设计 doc"	recommendation canvas
18	saas-economics-efficiency-metrics	财务	算 unit economics 和 capital 效率：CAC / LTV / payback / Rule of 40 / burn multiple	"unit economics / Rule of 40 / payback"	效率仪表板
19	saas-revenue-growth-metrics	财务	跟踪 revenue / retention / growth：MRR、ARR、churn、NRR、expansion、磁数	"MRR/ARR / 留存 / 扩张 / NRR"	增长指标仪表板
20	storyboard	视觉化	用 6 帧叙事 storyboard 可视化用户旅程	"storyboard / 6 frame / 故事板"	6 格 storyboard
21	user-story	敏捷	用 Mike Cohn 经典 + Gherkin 格式写 user story 与验收标准	"user story / acceptance criteria / Gherkin"	标准化 user story
22	user-story-mapping	敏捷	用 Jeff Patton story mapping 按 user workflow 组织 story	"story map / 用户工作流 / Patton"	故事地图（含 backbone）
23	user-story-splitting	敏捷	用 8 个 splitting pattern 拆大 story	"拆 story / story splitting / 太大"	拆分后的 story
25	context-engineering-advisor	AI 工程	诊断 context stuffing vs context engineering，引导 memory / retrieval 设计	"上下文塞太多 / RAG / agent memory"	context 工程方案
26	customer-journey-mapping-workshop	用户体验	引导多轮 journey mapping 工作坊（含 pain point 识别）	"journey mapping 工作坊 / 团队画 journey"	journey map + 痛点优先级
27	director-readiness-advisor	领导力	教 PM→Director 转变 4 类关键场景应对	"我要升 Director"	director 转变 coaching
28	discovery-interview-prep	用户研究	按 Mom Test 风格，根据研究目标定访谈方法 + 问题框架 + 偏差预警	"准备访谈 / 用户访谈 / Mom Test"	访谈计划 + 题目集
29	epic-breakdown-advisor	敏捷	用 Richard Lawrence 9 种 splitting pattern 把 epic 拆 story	"拆 epic / Lawrence 9 patterns"	epic → story 拆分方案
30	feature-investment-advisor	优先级	用 ROI + 战略价值评分评估功能投资	"做不做这个功能 / ROI"	feature 评分 + go/kill
31	finance-based-pricing-advisor	定价	用财务影响分析评估定价改动	"调价决策 / pricing 改动"	定价改动财务影响分析
32	lean-ux-canvas	战略规划	用 Jeff Gothelf Lean UX Canvas v2 做 hypothesis-driven 规划	"Lean UX canvas / 假设驱动规划"	Lean UX canvas 实例
33	opportunity-solution-tree	产品发现	用 Teresa Torres OST 从 outcome 到 opportunity 到 solution 到 experiment	"OST / opportunity solution tree / Torres"	OST 树 + POC 推荐
34	pol-probe-advisor	实验设计	推荐 5 种 prototype 中的合适型号：Feasibility / Task-Focused / Narrative / Synthetic / Vibe	"做哪种 prototype / vibe coding / 验证型 demo"	prototype 类型 + 设计建议
35	positioning-workshop	定位	用自适应问题引导多人完成定位定义	"定位 workshop / 团队对齐定位"	定位文档 + 共识记录
36	prioritization-advisor	优先级	推荐合适的 prioritization 框架（RICE / ICE / Kano / WSJF / MoSCoW...）	"怎么优先级 / RICE / Kano"	选定框架 + 评估表
37	problem-framing-canvas	问题框定	用 MITRE Problem Framing Canvas 三段（Look Inward / Look Outward / Reframe）输出 problem statement + HMW	"MITRE / 问题框定 canvas / HMW"	canvas + 重定义问题
38	tam-sam-som-calculator	市场规模	用真实数据 + 引用计算 TAM / SAM / SOM	"TAM SAM SOM / 市场规模 / VC 投递 deck"	市场规模估算 + 引用清单
39	user-story-mapping-workshop	敏捷	引导团队创建 backbone + release slice 的故事地图	"story mapping workshop / release slice"	故事地图 + release 切片
40	vp-cpo-readiness-advisor	领导力	教 Director→VP/CPO 跨越，含 CEO 面试框架	"升 VP / CPO / 高管转型"	VP/CPO coaching + 面试题
41	workshop-facilitation	主持	给任意 workshop 加分步主持 + 编号建议	"主持 / facilitation / 团队会议"	工作坊主持脚本
42	discovery-process	完整发现	3-4 周完整发现循环：frame → research → synthesize → validate；编排 10+ component / interactive skill	"完整发现流程 / continuous discovery"	发现总报告 + 可执行决策
43	executive-onboarding-playbook	领导力	30-60-90 天 VP/CPO 入职诊断 playbook	"VP / CPO 入职 / 30-60-90"	入职 playbook
44	prd-development	产品规划	2-4 天结构化 PRD：problem → personas → solution → metrics → stories；编排 8+ skill	"写 PRD / engineering handoff"	完整 PRD
45	product-strategy-session	战略	2-4 周完整战略 session：positioning → framing → exploration → roadmap	"产品战略 / 战略会议 / strategy session"	战略文档 + roadmap
46	roadmap-planning	战略	1-2 周战略 roadmap：inputs → epics → prioritize → sequence → communicate	"做 roadmap / roadmap 规划"	roadmap 文档
47	skill-authoring-workflow	元能力	写 skill 自身的元工作流：选路径 → 验证 → 更新文档 → 打包	"写一个 PM skill"	新的或更新过的 skill

## 7 Pawel Huryn（for PM）

#	Skill	描述 / 功能	触发场景	输出 / 产物
1	ab-test-analysis	用样本量、p-value、置信区间、guardrail metric 评估 A/B 测试，按"ship / extend / stop / investigate" 给决策；如果丢进原始 CSV 还会生成 Python 脚本算数	"A/B 结果 / 显著性 / 实验数据 / 我能 ship 吗"	实验分析报告 + 决策
2	cohort-analysis	算 cohort 留存曲线、功能采用率、按 segment 切分洞见	"cohort / 留存曲线 / feature adoption"	cohort 留存图 + 洞察
3	sql-queries	自然语言 → SQL（BigQuery / PostgreSQL / MySQL / Snowflake / SQL Server），可读 schema 文件，给优化建议	"写个 SQL / SQL 怎么写 / BigQuery query"	注释完备的 SQL + 解释
4	brainstorm-okrs	生成与公司目标对齐的团队 OKR	"OKR / 季度目标"	OKR 草案
5	create-prd	用 8 节 PRD 模板（Summary / Contacts / Background / Objective / Market / Value Prop / Solution / Release）写 PRD	"写 PRD / feature spec"	完整 PRD（保存为 markdown）
6	dummy-dataset	生成 CSV / JSON / SQL 格式的真实感假数据	"假数据 / fixture / 测试数据"	模拟数据集
7	job-stories	JTBD 格式写 job story + 验收标准	"job story / when X I want Y so Z"	job stories
8	outcome-roadmap	把 output roadmap（功能列表）改造成 outcome-driven 战略 roadmap	"outcome 路线图 / 别只列功能"	结果导向 roadmap
9	pre-mortem	对 PRD / 发布计划做 pre-mortem 风险分析（"假设它失败了，为什么"）	"pre-mortem / 这次发布会怎么挂"	风险清单 + mitigations
10	prioritization-frameworks	9 种优先级框架（RICE / ICE / Kano / WSJF / MoSCoW / Cost of Delay / Story Mapping / Buy a Feature / Opportunity Score）的速查 + 模板	"RICE / Kano / 优先级框架 / 哪个最合适"	框架对比 + 选用 + 评分表
11	release-notes	把 ticket / changelog 转成面向用户的发布说明	"release notes / changelog / 用户公告"	用户向 release notes
12	retro	主持结构化 sprint retrospective，输出 action items	"retro / 复盘 / 回顾会"	retro 输出 + action items
13	sprint-plan	做 sprint 规划：容量、故事选择、风险映射	"sprint plan / 排 sprint"	sprint 规划文档
14	stakeholder-map	用 power × interest 矩阵画利益相关者地图 + 沟通计划	"stakeholder / 利益相关者 / power interest"	矩阵 + 沟通计划
15	summarize-meeting	把会议 transcript 转成结构化纪要 + 待办	"会议总结 / 整理纪要"	结构化纪要 + 待办
16	test-scenarios	从 user story 生成全面测试场景	"测试用例 / test scenarios"	覆盖完备的测试场景
17	user-stories	用 INVEST + 3C's（Card / Conversation / Confirmation）写 user story	"user story / INVEST"	INVEST 合规 user story
18	wwas	用 Why-What-Acceptance 三段式写 backlog item，强调战略 context	"WWA / Why-What-Acceptance / backlog item"	独立可估的 WWA 条目
19	beachhead-segment	Geoffrey Moore 的滩头市场策略：用 burning pain × WTP × winnable × referral 4 维度选第一个市场	"滩头 / 第一个细分市场 / 哪个市场先打"	beachhead 推荐 + 90 天获客方案
20	competitive-battlecard	销售可用的竞品对比 battlecard	"battlecard / 销售对竞品 / 我们 vs Salesforce"	sales battlecard
21	growth-loops	在 5 类 flywheel 里识别合适的 growth loop	"growth loop / flywheel / 增长引擎"	增长 loop 设计
22	gtm-motions	在 7 种 GTM 动作（PLG、SLG、ABM、Inbound、Outbound、Community-led、Channel）里挑组合	"GTM motion / PLG / ABM / 哪种 motion 合适"	GTM motion 推荐
23	gtm-strategy	出 GTM 策略：渠道、message、发布时间线	"GTM strategy / 上市策略 / launch plan"	GTM 策略文档
24	ideal-customer-profile	定 ICP：人口学 + 行为 + JTBD	"ICP / 理想客户画像"	ICP 文档
25	competitor-analysis	分析竞品的优势 / 劣势 / 差异化	"竞品分析 / strengths / weaknesses"	竞品分析报告
26	customer-journey-map	画 journey：触点、情绪、改进机会	"客户旅程 / customer journey"	journey map
27	market-segments	找 3-5 个客户细分（含 JTBD 与 product fit）	"市场细分 / segment"	3-5 段 segment 描述
28	market-sizing	用 top-down + bottom-up 估 TAM / SAM / SOM	"TAM SAM SOM / 市场规模"	市场规模估算
29	sentiment-analysis	给用户反馈做情感打分 + JTBD 洞察	"用户反馈 / sentiment / 评论分析"	情感与 JTBD 洞察
30	user-personas	出 3 个用户 persona（含 JTBD + pains + gains）	"user persona / 用户画像"	3 个 persona
31	user-segmentation	按行为、JTBD、需求从反馈数据切分用户群	"用户分群 / 行为分群"	用户分群方案
32	marketing-ideas	出 5 条创意、低成本营销点子 + rationale	"营销点子 / cheap ideas"	5 条点子
33	north-star-metric	先把业务划分成 Attention / Transaction / Productivity 三类 game，再按 7 项标准选 NSM + 3-5 个 input metric	"North Star / NSM / 关键指标 / OMTM"	NSM + 输入指标 constellation
34	positioning-ideas	跟竞品差异化的定位创意	"positioning / 定位 / 跟 Notion 不一样"	多条定位假设
35	product-name	起 5 个对齐品牌价值的产品名	"起名 / product name"	5 个候选名 + 解读
36	value-prop-statements	给营销 / 销售 / onboarding 写 value prop 声明	"value prop / 价值主张 / 销售话术"	多场景 value prop
37	analyze-feature-requests	按主题、影响、努力、风险给 feature request 排优先级	"feature request / 客户需求堆 / 怎么排"	主题化 + 评分清单
38	brainstorm-experiments-existing	给现有产品设计实验，验证假设	"现有产品 / 验证假设 / 实验"	实验设计
39	brainstorm-experiments-new	给新产品设计 lean pretotype（Savoia）	"新产品 / pretotype / 早期验证"	pretotype 实验
40	brainstorm-ideas-existing	从 PM / 设计师 / 工程师三视角给现有产品脑暴点子	"脑暴点子 / 现有产品 / Product Trio"	多视角点子
41	brainstorm-ideas-new	早期发现阶段为新产品脑暴功能点子	"新产品 / 早期点子"	早期 idea 清单
42	identify-assumptions-existing	现有产品功能的 Value / Usability / Viability / Feasibility 风险假设 + 验证建议	"现有产品风险假设 / 这个功能会挂吗"	4 维风险假设清单
43	identify-assumptions-new	新产品在 8 类风险（含 Ethical / Compliance）下的假设识别	"新产品 / 8 类风险 / 假设"	风险假设清单
44	interview-script	含 JTBD 探询的客户访谈脚本	"访谈 / interview script / Mom Test"	访谈脚本 + 题目
45	metrics-dashboard	设计产品指标 dashboard，含数据源与告警阈值	"metrics dashboard / 监控 / 告警"	dashboard 规格
46	opportunity-solution-tree	Teresa Torres OST：outcome → opportunities → solutions → experiments；强调 Importance ×(1−Satisfaction) 的 opportunity score	"OST / Torres / continuous discovery"	OST 树 + 实验
47	prioritize-assumptions	用 Impact × Risk 矩阵给假设排序 + 实验配对	"假设排序 / 测哪个先 / Strategyzer"	假设矩阵 + 实验映射
48	prioritize-features	按影响 / 努力 / 风险 / 战略对齐 4 维给 backlog 排序	"排 backlog / 优先级矩阵"	排序后的 backlog
49	summarize-interview	把访谈 transcript 总结成 JTBD + 行动项	"访谈总结 / 提炼 JTBD"	访谈纪要 + 洞察
50	ansoff-matrix	Ansoff 矩阵 4 象限（市场渗透 / 市场开发 / 产品开发 / 多元化）增长策略分析	"Ansoff / 增长矩阵"	Ansoff 分析
51	business-model	9 块 Business Model Canvas（Strategyzer）	"BMC / 商业模式画布"	完整 BMC
52	lean-canvas	Ash Maurya Lean Canvas（Problem / Solution / UVP / Unfair Advantage / 等 9 段），并主动指出和 Startup Canvas 的差异与建议	"Lean Canvas / 创业画布"	Lean Canvas
53	monetization-strategy	给出 3-5 个变现策略 + 验证实验	"怎么变现 / monetization"	3-5 套变现方案
54	pestle-analysis	PESTLE 6 维（政治、经济、社会、科技、法律、环境）外部环境分析	"PESTLE / 宏观分析"	PESTLE 报告
55	porters-five-forces	Porter 五力模型：竞争、供应商、买家、替代品、新进入者	"Porter 五力 / 行业分析"	五力分析
56	pricing-strategy	含竞品对比 + WTP（支付意愿）估算的定价策略	"pricing / 定价策略 / WTP"	定价方案
57	product-strategy	用 Paweł Huryn 9-section Product Strategy Canvas 写产品战略	"产品战略 / strategy canvas"	9 段战略 canvas
58	product-vision	起鼓舞人心又可达成的 vision statement	"vision / 产品愿景"	vision 候选
59	startup-canvas	Paweł Huryn 自创 Startup Canvas = Product Strategy + Business Model 的合并版本	"startup canvas / Huryn 自创 canvas"	startup canvas
60	swot-analysis	SWOT 四象限 + 每象限的 actionable 推荐	"SWOT"	SWOT 报告
61	value-proposition	6 段式 JTBD 价值主张设计	"value proposition / VPC / 价值设计"	6 段 VP
62	draft-nda	起草 NDA：信息类型、司法管辖、关键条款	"NDA / 保密协议"	NDA 草案
63	grammar-check	找语法 / 逻辑 / 流畅度问题，给定向修改建议	"改语法 / proofread / 改文风"	错误清单 + 改写
64	privacy-policy	起草隐私政策（含 GDPR / CCPA 合规考量）	"隐私政策 / GDPR / privacy policy"	隐私政策草案
65	review-resume	PM 简历对照 10 项最佳实践（含 XYZ+S 公式 + 关键词 + 结构）逐条审	"改 PM 简历 / 简历审查"	简历改造建议 + 关键词命中

## 8 Context Engineering

#	Skill	描述 / 功能	触发场景	输出 / 产物
1	context-fundamentals	Context Engineering 的"地基课"：解释 context 是什么、context window 解剖、attention 机制、U 形 attention 曲线、四大原则（informativity / position-aware / progressive disclosure / iterative curation）；明确把"出问题就 route 给 context-degradation、要省 token route 给 context-optimization……"全部声明	新人 onboarding；做架构决策前先讲清楚原理；写文档要给操作建议铺垫机制	概念讲解、心智模型、知识地图（不做"做"的事）
2	context-degradation	把"context 变烂"拆成 5 种可观测模式：lost-in-middle / poisoning / distraction / confusion / clash。每种给 detection signals + mitigation + 截断恢复策略	agent 在长会话中性能突然下降；输出"忘记之前的指令"；调试 attention 失效	失效模式诊断 + 修复方案
3	context-optimization	Token 效率 4 把刀按优先级排：KV-cache 优化 > observation masking > compaction（70% 阈值触发） > context partitioning；给具体阈值表（≥70% 压缩、≥60% 才考虑切多 agent）	token cost 太高；prefix cache 命中率低；retrieval 拉太多噪音	优化策略组合 + 阈值配置
4	context-compression	长会话压缩 3 种策略：Anchored Iterative Summarization（结构化增量摘要，保留 file paths / decisions / next steps）、Opaque Compression（高比例但不可读，仅短会话）、Regenerative Full Summary。强调优化目标是 tokens-per-task 而非 tokens-per-request；artifact trail 完整性是首要指标	会话超出 context；要写跨 session handoff 摘要；agent 老"忘记改过哪些文件"	持久化 handoff 摘要 + 结构化决策日志
5	filesystem-context	把文件系统当 context 的"溢出层"：4 类失败模式（missing / under-retrieved / over-retrieved / buried），分别用 scratch pad / 结构化文件 / 把大输出落盘后只回引用 / glob+grep+语义搜索 来治；强调 dynamic context discovery 优于 static include	工具输出膨胀；sub-agent 之间要共享中间结果；agent 要持续更新自己的指令	文件化 scratchpad、tool-output 卸载方案
6	memory-systems	跨 session 持久语义记忆的选型指南：Mem0（向量+图）/ Zep+Graphiti（双时态知识图）/ Letta（自编辑分层记忆）/ Cognee（多层语义图 ECL pipeline）四种架构对比 + LoCoMo / LongMemEval / DMR / MemBench 等基准选用建议	选记忆框架；要做 entity 一致性 / 多跳推理 / 时间旅行查询；评估记忆基准	框架选型 + 评估方案
7	latent-briefing	多 agent 之间在 KV cache 表征层共享记忆（不是文本摘要）。基于 Attention Matching + 任务条件 query + 共享 head mask + median + tau·MAD 阈值，给 orchestrator-worker 系统省 worker token	hierarchical / orchestrator-worker / 递归 LM 出现 token 爆炸；总文本 handoff 太贵；研究 KV cache compaction 作为 inference primitive	表征级 handoff 方案（仅适用于能拿到 KV 的运行时）
8	bdi-mental-states	把外部 RDF 上下文转成 Agent 的 BDI（Belief / Desire / Intention）心智状态，区分 endurant（持久状态）vs perdurant（变迁过程），用 motivates / fulfils 双向属性串成认知链；面向 SEMAS / JADE / JADEX / LAG 等神经符号架构	用形式化认知架构做可解释推理；多 agent 心智协调；从感知 → 信念 → 欲望 → 意图的全链路追踪	BDI 本体 + SPARQL 能力问题
9	multi-agent-patterns	三种拓扑（Supervisor / 对等 swarm / Hierarchical）选型；强调 sub-agent 的存在是为了隔离 context，不是模拟组织角色；显式 handoff 协议、防 sycophancy 共识、错误级联防护	单 agent context 不够；任务可天然并行；不同子任务需要不同 prompt/tool；scaling beyond 单窗口	多 agent 拓扑 + 协调协议
10	hosted-agents	把 agent 跑在远端 sandbox 里（Modal / Cloudflare DO 风格）：image registry 30 分钟预热、warm pool、session 持久化、多端共享、self-spawning sub-agent。设计目标：session 启动只受 model TTFT 限制	后台 agent；多端协作（Slack/Web/Chrome）；超本地资源限制；agent 能 spawn sub-agent	三层架构（sandbox / API / client）+ image 策略
11	harness-engineering	给"自主 agent loop"的控制系统：4 类 surface（Locked 锁定 / Editable 可改 / Append-only 仅追加 / Human-controlled 人工审批）、紧反馈环、novelty gate、ablation、pruning、rollback、durable log、PR 提交边界；参考 Karpathy autoresearch、AlphaEvolve、FunSearch	长跑自主研究 loop；防止 agent gaming benchmark；带 PR 的后台 agent；定义"什么操作必须人工审"	控制平面规格 + 治理边界
12	tool-design	单工具 / 工具集层面的设计：把 description 当成 prompt 而不是文档；consolidation 原则（人都决定不了用哪个，agent 更不行）；命名空间 db_* / web_*；可恢复 error；MCP 适配。配 Vercel d0「砍掉 80% 工具」案例	加新 tool；调"agent 选错工具"；归并冗余工具集；评估第三方 tool 是否值得加	tool description / schema / error 模板
13	evaluation	Agent 评测的"基础课"：outcome over path、多维 rubric（factual / completeness / citation / source / tool efficiency）、先做确定性检查再上 LLM judge、token 预算 + 工具调用次数 + 模型选择是性能方差三大主因（参考 BrowseComp 研究）	系统性测 agent；做 quality gate；catch regression；持续生产监控	rubric + 回归套件 + 监控指标
14	advanced-evaluation	专门做 LLM-as-judge 的进阶套：Direct Scoring vs Pairwise；偏置 landscape（position / length / self-enhancement / verbosity）+ 各自缓解（双向交换、长度归一、不同模型生成 vs 评判）；G-Eval / MT-Bench 方法	自动化质量评估；rubric 校准；对 prompt/model 改动做 A/B；评估系统不一致排查	校准过的 LLM judge pipeline
15	project-development	项目级方法论：先做 task-model fit（提供两个表，proceed / stop 各自的特征清单），然后用 5 段式 pipeline（acquire → prepare → process → parse → render）画形；token + 美元成本估算；single vs multi-agent 在项目级别的取舍；agent-assisted 迭代。配 Karpathy HN Capsule、Vercel d0、Manus 三个案例	立项前判断"该不该用 LLM"；设计批处理 / agent pipeline；做成本预估；决定项目级单/多 agent	项目可行性 + pipeline 形态决策

## 9 Productivity and Collaboration

#	仓库::Skill	描述 / 功能	触发场景	技术栈
1	PSPDFKit-labs/nutrient-agent-skill::nutrient-document-processing	PDF 全套：转换 / merge / 抽文本+表 / OCR / pattern+AI redact / 水印 / CMS 签名 / 表单 / PDF-A / 优化	OCR 扫描件、docx→PDF+签名、脱敏 SSN	Nutrient DWS API + Python + uv
2	kreuzberg-dev/kreuzberg::kreuzberg	90+ 文件格式 + 300+ 编程语言 tree-sitter 语义抽取，TOON 序列化省 30-50% token，143 个 LLM/VLM provider 做 VLM-OCR	抽 PDF 表格、抽代码语义、Gemini OCR	Rust 内核 + 14 语言 binding + Tesseract/PaddleOCR/EasyOCR
3	deusyu/translate-book::translate-book	整本书并行翻译（PDF/DOCX/EPUB），8 路 subagent + manifest SHA-256 + glossary 实体一致性	翻译书、重译错误章节、保持术语	Calibre + Pandoc + Python 3.12 + subagent
4	makenotion/notion-cookbook::skills/*	Notion × Claude MCP 工作流（自动化文档撰写、会议准备、研究等；具体清单需进入 skills/ 目录查看）	"用 Notion MCP 写 spec"、"汇总会议纪要"	Notion MCP + API
5	PleasePrompto/notebooklm-skill::notebooklm	浏览器自动化让 Claude Code 直接和 NotebookLM 对话，做 source-grounded QA	"用我 NotebookLM 那本书答"	Patchright + Chrome + Python
6	bevibing/tutor-skills::tutor-setup	把 PDF/MD/HTML/EPUB/源代码 → Obsidian StudyVault，自动检测 Document/Codebase 模式	"把这本书做成学习笔记"	纯 Markdown + wiki-link
7	bevibing/tutor-skills::tutor	4 题/轮交互测验，按概念粒度记录 🟥/🟨/🟩/🟦/⬜ 自动 drill 弱区	"测我学到什么程度"	同上
8	op7418/NanoBanana-PPT-Skills::nanobanana-ppt	文档分析→PPT 大纲→Nano Banana Pro 出图→可灵 AI 转场视频→FFmpeg 合成 + 交互播放器	"把文档做成 PPT 视频"	Gemini 3 Pro Image + 可灵 AI + FFmpeg
9	zarazhangrui/frontend-slides::frontend-slides	零依赖单 HTML 演示，1920×1080 固定 stage，12 视觉风格预设，PPTX→web，Vercel 部署 + Playwright PDF	"做个动画演示"、"PPTX→网页"	Motion + Playwright + Chromium
10	op7418/Youtube-clipper-skill::youtube-clipper	6 阶段：环境检测→下载→AI 章节切分（2-5 分钟级）→选段→双语字幕烧录+总结	"剪 YouTube"、"双语字幕版本"	yt-dlp + ffmpeg-full（libass）+ pysrt
11	gokapso/agent-skills::integrate-whatsapp	接 WhatsApp Cloud API、配 webhook、发 message/template/flow	"接 WhatsApp 发消息"	Kapso API + CLI
12	gokapso/agent-skills::automate-whatsapp	用 workflow / agent / function / database 搭 WhatsApp 自动化	"建 WhatsApp 自动化"	同上
13	gokapso/agent-skills::observe-whatsapp	Debug 投递问题、查 webhook delivery、健康检查	"为什么消息没送达"	同上
14	wrsmith108/linear-claude-skill::Linear	Linear issue/project/initiative 管理，MCP / CLI / script 三 backend 自适应，批量 sync code→ticket	"标 ENG-101 Done"、"建一批 issue"	mcp__linear / Linear CLI / GraphQL
15	ognjengt/founder-skills::sop-creator	写企业流程 SOP	"写员工 onboarding 流程"	markdown + FOUNDER_CONTEXT.md
16	ognjengt/founder-skills::cro-optimization	用 13 项 CRO 原则诊断 landing page，给前后对比改写	"审 landing page CRO"	同上
17	ognjengt/founder-skills::viral-hook-creator	写病毒式内容 hook	"给这个 launch 写 hook"	同上
18	ognjengt/founder-skills::lead-magnet-generator	写带 CTA 的 lead magnet（X/LinkedIn 快/详细版）	"做个 lead magnet 帖子"	同上
19	ognjengt/founder-skills::strategic-planning	诊断瓶颈，给 3 个高影响下一步	"我下一步该做什么"	同上
20	ognjengt/founder-skills::go-to-market-plan	3 套 GTM 策略	"GTM 怎么做"	同上
21	ognjengt/founder-skills::x-writer	3 条 X 帖（51+ 模板 × 6 voice：Hormozi/Naval/Gazdecki/Dakota/Machina/Ognjen × 8 format）	"写 3 条 viral X"	同上
22	ognjengt/founder-skills::linkedin-writer	2 条 LinkedIn 帖（8+ 模板 × 7 format：Lessons/Blueprint/Story/Strategy/Case/Hot Take/Quick Hack）	"写 LinkedIn 帖"	同上
23	ognjengt/founder-skills::outreach-specialist	cold email/LinkedIn DM/X DM 8 模板 + 跟进策略	"写一套外联序列"	同上
24	ognjengt/founder-skills::competitor-intel	竞品分析（指标 + leverage 策略 + 下一步预测）	"分析竞品 X"	同上
25	ognjengt/founder-skills::brand-copywriter	AIDA/PAS/BAB 框架文案（广告 / landing / 邮件）	"写广告文案"	同上
26	ognjengt/founder-skills::pricing-strategist	交互 Q&A 出分层定价 + revenue optimization	"做定价方案"	同上
27	ognjengt/founder-skills::prd-generator	给 AI 编程工具用的 PRD（带追问，输出 PDF 到 prd_outputs/）	"给 Claude Code 写 PRD"	同上
28	ognjengt/founder-skills::product-hunt-launch-plan	PH 拿 #1 战术：小时级 battle plan + 模板 + 20+ 备选发布平台	"PH 怎么打 #1"	同上
29	ognjengt/founder-skills::marketing-ideas	从 160+ 策略库给 5 条最佳	"给我 5 条营销创意"	同上
30	Digidai/product-manager-skills::pm-operator	30+ 框架 + SaaS 健康诊断 + PRD 同侪审 + 6 阶段全 PM Sprint + Coaching 模式	"诊断 SaaS 健康"、"审 PRD"、"coach 我"	7 知识模块 + 12 模板 + 8 examples
31	EveryInc/charlie-cfo-skill::charlie	Bootstrapped CFO（致敬 Charlie Munger）：runway / LTV:CAC / Rule of 40 / hiring ROI / driver-based forecast	"招聘 ROI"、"runway"、"13 周现金流"	纯框架 + Mailchimp/Zapier/Basecamp 案例
32	mvanhorn/last30days-skill::last30days	Reddit upvote / X 点赞 / YouTube 转录 / HN / Polymarket 当"投票"，并行搜索+评分+引用合成	"Kanye 最近 30 天怎样"、"AI agent 这周热议"	Python + yt-dlp + ScrapeCreators + Polymarket API
33	ReScienceLab/opc-skills::seo-geo	SEO + GEO（面向 ChatGPT/Perplexity/Google 的生成引擎优化）	"扫 ChatGPT 搜索曝光"	纯 prompt
34	ReScienceLab/opc-skills::requesthunt	Reddit/X/GitHub 用户需求挖掘	"找用户痛点"	API
35	ReScienceLab/opc-skills::domain-hunter	域名查找 + 注册商比价 + 优惠码（依赖 twitter+reddit）	"找个好域名"	#NAME?
36	ReScienceLab/opc-skills::logo-creator	AI 出 logo 并裁剪、去背、导 SVG（依赖 nanobanana）	"给我做 logo"	#NAME?
37	ReScienceLab/opc-skills::banner-creator	GitHub/Twitter/LinkedIn banner 生成（依赖 nanobanana）	"做 GitHub banner"	#NAME?
38	ReScienceLab/opc-skills::nanobanana	用 Gemini 3 Pro Image (Nano Banana Pro) 出图	"出张图"	Gemini Image API
39	ReScienceLab/opc-skills::reddit	Reddit JSON API 查内容	"搜 r/SaaS 热门"	Reddit JSON
40	ReScienceLab/opc-skills::twitter	twitterapi.io 查 Twitter/X	"查 X 上谁谈这个"	twitterapi.io
41	ReScienceLab/opc-skills::producthunt	查 Product Hunt 帖子/topic/user/collection	"PH 上类似产品"	PH API
42	ReScienceLab/opc-skills::archive	会话学习 / debug 解归档（带索引 markdown）	"归档这次调试经验"	纯 markdown
43	Paramchoudhary/ResumeSkills::resume-ats-optimizer	过 ATS：兼容性检查 + 关键词命中	"ATS 优化简历"	markdown
44	Paramchoudhary/ResumeSkills::resume-bullet-writer	把弱 bullet 改成成就+指标+影响	"改 bullet"	同
45	Paramchoudhary/ResumeSkills::resume-quantifier	给 bullet 加可量化数字	"加 metrics"	同
46	Paramchoudhary/ResumeSkills::resume-formatter	干净易扫格式	"排简历版式"	同
47	Paramchoudhary/ResumeSkills::resume-section-builder	定向构造章节	"新加 leadership 章节"	同
48	Paramchoudhary/ResumeSkills::job-description-analyzer	JD 分析：匹配分 + gap + 申请策略	"我能投这个吗"	同
49	Paramchoudhary/ResumeSkills::resume-tailor	针对特定 JD 改简历（保持真实）	"针对 X 公司改"	同
50	Paramchoudhary/ResumeSkills::resume-version-manager	多版本简历管理	"管理 3 个版本"	同
51	Paramchoudhary/ResumeSkills::offer-comparison-analyzer	offer 对比	"比较两个 offer"	同
52	Paramchoudhary/ResumeSkills::cover-letter-generator	用简历+JD 生成个性化 cover letter	"写 cover letter"	同
53	Paramchoudhary/ResumeSkills::linkedin-profile-optimizer	LinkedIn 同步 + 可搜索性优化	"优化我 LinkedIn"	同
54	Paramchoudhary/ResumeSkills::portfolio-case-study-writer	作品集 case study	"写 portfolio 案例"	同
55	Paramchoudhary/ResumeSkills::reference-list-builder	推荐人清单	"做 reference list"	同
56	Paramchoudhary/ResumeSkills::interview-prep-generator	从简历生成 STAR 故事+练习题+谈点	"Google 面试准备"	同
57	Paramchoudhary/ResumeSkills::salary-negotiation-prep	市场行情研究 + 谈判脚本	"谈薪资"	同
58	Paramchoudhary/ResumeSkills::tech-resume-optimizer	工程/PM/技术高管专用	"改技术高管简历"	同
59	Paramchoudhary/ResumeSkills::executive-resume-writer	C-suite/VP 简历	"VP 简历"	同
60	Paramchoudhary/ResumeSkills::academic-cv-builder	学术 CV	"学术职位 CV"	同
61	Paramchoudhary/ResumeSkills::creative-portfolio-resume	设计/创意类简历	"creative 简历"	同
62	Paramchoudhary/ResumeSkills::career-changer-translator	跨行业转岗（把已有经验"翻译"成新行业语言）	"我从 X 转 Y"	同
63	santifer/career-ops::oferta	单 JD A-F 评分评估	"评这个 JD"	Claude + Markdown
64	santifer/career-ops::pdf	ATS-optimized PDF 生成（Playwright + HTML 模板）	"出 PDF 简历"	Playwright
65	santifer/career-ops::scan	扫 Greenhouse/Ashby/Lever portal	"扫这家公司新岗"	Playwright + Greenhouse API + WebSearch
66	santifer/career-ops::batch	批处理 N 个 JD	"批处理 50 个 JD"	Markdown TSV + shell
67	santifer/career-ops::interview-prep	STAR+R 面试准备	"Google 面试准备"	Claude
68	santifer/career-ops::（其余 ~9 mode）	cv-sync-check / liveness / followup-cadence / merge-tracker / dedup / doctor / analyze-patterns / normalize-statuses 等支撑 mode（具体名需查 modes/）	配套自动化	mjs 脚本 + Markdown
69	openaccountants::tax	各国所得税 / VAT / GST 税率、申报流程、阈值（134 国 + 51 美国州 + 13 加拿大省）	"California 报税"	Markdown skill 集，按辖区组织
70	openaccountants::bookkeeping	各国 chart of accounts / P&L 格式 / 费用归类	"建本国 COA"	同
71	openaccountants::e-invoicing	各国电子发票 mandatory fields / 传输格式	"发票通过验证"	同
72	openaccountants::payroll	PAYE / 社保 / 工资单格式	"本国跑工资"	同
73	openaccountants::company-formation	实体类型 / 注册步骤 / 成本	"在 Estonia 注册公司"	同
74	openaccountants::financial-statements	年度账目 / 报告框架 / 审计阈值	"出年报"	同
75	openaccountants::transfer-pricing	TP 文档 / 公平定价 / CbCR	"跨国 TP 合规"	同
76	openaccountants::tax-optimization	合法扣除 / 时机策略 / 实体结构	"合法少交税"	同
77	openaccountants::crypto-tax	加密资产税务	"BTC 报税"	同
78	openaccountants::cross-border	跨境 / Pillar Two / DAC7 等	"Pillar Two 我要做啥"	同
79	openaccountants::verticals + integrations + intelligence + patterns	行业垂直（SaaS/REIT/银行）+ 平台导出（Xero/Stripe/PayPal/QBO）+ 截止日期/阈值情报 + 全球 vendor pattern	"SaaS 年报模板"、"Stripe→Xero"	MCP + 自动加载辖区
80	hanfang/claude-memory-skill::mem	分层 markdown 记忆（core.md + topics/<x>.md + me.md），后台 agent 写不阻塞主 agent，纯 grep 检索	"记住我们用 pnpm"	shell + markdown + Claude Code hook
81	Shpigford/readme::readme	自动生成 README + 安装说明 + API 文档模板 + 贡献指南	"给项目写 README"	npx mdskills install
82	NeoLabHQ/context-engineering-kit::write-concisely	套用《Elements of Style》改写：去冗、强动词、被动→主动、改结构	"把这段说明书改清楚"	纯 prompt
83	SeanZoR/claude-speed-reader::speed	RSVP 速读 Claude 回复（600+ WPM，红色高亮 ORP）	"/speed 读最近回复"	本地 HTML + macOS open
84	obra/superpowers::test-driven-development	RED-GREEN-REFACTOR：先红→最小绿→重构提交	"TDD 这个新功能"	#NAME?
85	obra/superpowers::systematic-debugging	4 阶段根因（含 root-cause-tracing / defense-in-depth / condition-based-waiting）	"调试这个 bug"	子方法
86	obra/superpowers::verification-before-completion	"真的修好了吗"完工验证	"确认这次 fix 完成"	shell
87	obra/superpowers::brainstorming	苏格拉底式设计精炼，分段呈现给用户验证	"开始一个新功能"	Claude
88	obra/superpowers::writing-plans	把功能拆 2-5 分钟微任务，每个任务给精确文件路径+完整代码+验证	"做实施计划"	Claude
89	obra/superpowers::executing-plans	批次执行 + 人工 checkpoint	"按计划执行"	Claude
90	obra/superpowers::dispatching-parallel-agents	并行 subagent 工作流编排	"并行做 X 和 Y"	subagent
91	obra/superpowers::requesting-code-review	提交前 review 清单	"review 我这次改动"	Claude
92	obra/superpowers::receiving-code-review	接 review 反馈处理	"处理 review 意见"	Claude
93	obra/superpowers::using-git-worktrees	在新 branch 创隔离 workspace + 跑 setup + 验证 baseline 干净	"开发新分支"	git worktree
94	obra/superpowers::finishing-a-development-branch	验证完成 → 选 merge/PR/keep/discard → 清理 worktree	"结束这个分支"	gh + git
95	obra/superpowers::subagent-driven-development	每任务派 fresh subagent + 双阶段 review（spec compliance → code quality）	"代理化开发"	subagent
96	obra/superpowers::writing-skills	创建符合最佳实践的新 skill（含测试方法）	"写新 skill"	Claude
97	obra/superpowers::using-superpowers	superpowers 体系 onboarding	"什么是 superpowers"	Claude
98	obra/superpowers-lab::finding-duplicate-functions	语义代码去重：Haiku 分类 → Opus 找同意图不同实现	"找语义重复"	Haiku + Opus
99	obra/superpowers-lab::mcp-cli	按需用 MCP server，不污染上下文	"查这个 MCP 有什么 tool"	mcp CLI
100	obra/superpowers-lab::using-tmux-for-interactive-commands	tmux 操控交互 CLI（vim/git rebase -i/menuconfig/REPL）	"agent 进 vim 改"	tmux
101	obra/superpowers-lab::windows-vm	headless Win11 in Docker + KVM + SSH（自动装 OpenSSH+Node+Claude Code）	"在 Windows 上跑"	dockur/windows + KVM
102	Charlie85270/Dorothy::desktop-orchestrator	Electron 桌面 app 并行编排 10+ agent，含 6 个 MCP server（orchestrator/kanban/vault/socialdata/telegram/x），Kanban 自动派单 + 定时任务 + GitHub PR/Issue 触发 + Telegram/Slack 远控；另含 .claude/skills/、.codex/skills/、.cursor/skills/ 镜像目录	"10 个 agent 并行"、"PR 触发 review agent"、"Telegram 远控"	Electron + Next.js + xterm.js + node-pty + better-sqlite3 + MCP SDK



### Firecrawl评的best claude code skills

- Firecrawl

- Andrej Karpathy\&\#39;s Guidelines

- Frontend Design

- Superpowers

- Vercel Web Design Guidelines

- Vercel React Best Practices

- Vercel Composition Patterns

- Document Skills

- Webapp Testing

- Trail of Bits Security

- Remotion Best Practices

- Skill Creator

#	条目	形态	描述
1	Firecrawl	仓库（5 skill）	Firecrawl 官方 skill 包，对应 firecrawl/cli 仓库（旧版叫 firecrawl-claude-plugin）。把 Firecrawl 的网页抓取 / 搜索 / 数据提取能力封装成 5 个 skill，能把任意网站转成 LLM 友好的 markdown 或结构化数据，直接在 Claude Code / Cursor / Codex 里用，配套 CLI + Workflows + MCP 三种入口。
2	Andrej Karpathy's Guidelines	单文件（CLAUDE.md，非 skill）	multica-ai/andrej-karpathy-skills 仓库其实只放了一个 CLAUDE.md——把 Karpathy 在 X 上发的 4 条 Claude Code 行为准则（关于 LLM 编码常见陷阱）固化成行为约束。零依赖、零 API、零构建，归类是"行为约束模板"而不是 Agent Skill。
3	Frontend Design	单 skill	Anthropic 17 skills 之一（anthropics/skills/skills/frontend-design/，同时镜像到 anthropics/claude-code/plugins/frontend-design/）。让 Claude 在写前端时主动避开"AI slop"通用美学：选有特色的字体、承诺主色 + 重音、有层次的背景、有节制的动效；尤其适合 React + Tailwind 项目。
4	Superpowers	仓库（14 skill）	obra/superpowers，社区里事实上的"Claude Code 开发方法论"标准（210k star）。一整套软件工程工作流：brainstorming → writing-plans（拆 2-5 分钟微任务）→ subagent-driven-development（每任务派 fresh subagent）→ test-driven-development（强制 RED-GREEN-REFACTOR）→ requesting/receiving-code-review → using-git-worktrees → finishing-a-development-branch；外加 systematic-debugging、verification-before-completion、dispatching-parallel-agents、writing-skills 等 14 个 skill 串成端到端流程。
5	Vercel Web Design Guidelines	单 skill	vercel-labs/agent-skills/skills/web-design-guidelines/。审 UI 代码是否符合 Vercel 内部前端守则：100+ 条规则跨 11 类——可访问性（aria / 语义 HTML / 键盘）、focus 状态、表单（autocomplete / 校验）、动效（prefers-reduced-motion）、排印（curly quotes / tabular-nums）、图片（尺寸 / lazy / alt）、性能（虚拟化 / preconnect）、URL 反映状态、dark mode（color-scheme / theme-color）、触控（touch-action）、Intl 国际化。会拉最新版的 Web Interface Guidelines 现场对照。
6	Vercel React Best Practices	单 skill	vercel-labs/agent-skills/skills/react-best-practices/。Vercel 工程团队内部的 React + Next.js 性能 playbook，40+ 条规则按影响力排成 8 个优先级类别：消除瀑布请求（Critical）、bundle size（Critical）、服务端性能（High）、客户端 fetch（Medium-High）、重渲染优化（Medium）、渲染性能（Medium）、JS 微优化（Low-Medium）。写新组件 / 新 page 或 review 性能时触发，直接给定向修改建议。
7	Vercel Composition Patterns	单 skill	vercel-labs/agent-skills/skills/composition-patterns/。专门治"boolean prop 爆炸"的组件 API 设计：把 <Modal showHeader showFooter showClose closable dismissible …> 这种重构成 compound component（<Modal.Header /> <Modal.Body />）、把状态提升来减少 prop、用内部组合替代 prop drilling；适合做组件库或重构现有组件 API。
8	Document Skills	仓库 / plugin（4 skill）	Anthropic 官方 anthropics/skills 仓库下打包成名为 document-skills 的一个 plugin，含 docx / pdf / pptx / xlsx 4 个 SKILL.md：创建 / 编辑 / 解析 4 类 Office 文档，支持 Word 修订追踪与批注、PDF 表单与文本提取、PowerPoint 内容编辑、Excel 公式 / 数据保留。源码可见但不是开源 license，是 Anthropic 自家 source-available 的"参考实现"。
9	Webapp Testing	单 skill（在 awesome 列表内）	ComposioHQ/awesome-claude-skills/webapp-testing/SKILL.md（被多个 awesome 列表镜像收录）。让 Claude 用 Playwright 测本地跑的 webapp：跨浏览器（Chromium/Firefox/WebKit）+ 移动设备模拟 + 截图 + 网络拦截 + 控制台错误捕获。验证前端功能、debug UI 行为、回归截图都用它。
10	Trail of Bits Security	仓库 / marketplace（35+ plugin）	trailofbits/skills，安全审计领域目前最完整的 skill 集合，按业务线分成 9 个 plugin：智能合约（building-secure-contracts 跨 6 链 + entry-point-analyzer）、代码审计（c-review、differential-review、fp-check、insecure-defaults、semgrep-rule-creator/variant-creator、sharp-edges、static-analysis、supply-chain-risk-auditor、testing-handbook、trailmark、variant-analysis、agentic-actions-auditor、audit-context-building、burpsuite-project-parser、dimensional-analysis）、恶意代码（yara-authoring）、形式化验证（constant-time-analysis、mutation-testing、property-based-testing、spec-to-code-compliance、zeroize-audit）、逆向（dwarf-expert）、移动（firebase-apk-scanner）、开发辅助（ask-questions-if-underspecified、devcontainer-setup、git-cleanup、modern-python、seatbelt-sandboxer、second-opinion、skill-improver、workflow-skill-design、let-fate-decide）等。每个 skill 都被 Trail of Bits 内部 vetted 过质量与安全。
11	Skill Creator	单 skill	Anthropic 17 skills 之一（anthropics/skills/skills/skill-creator/）。元 skill：教 Claude 如何创建新 skill、改进现有 skill、衡量 skill 表现。包含 SKILL.md 模板、frontmatter 规范、progressive disclosure 设计原则、references/ 与 scripts/ 目录组织建议、性能测试方法。Anthropic 官方 PDF《The Complete Guide to Building Skills for Claude》也建议先装它再写自己的 skill。
➕	Remotion Best Practices	仓库（实际 1 skill）	remotion-dev/skills，仓库下只发布了一个 skills/remotion/ 目录。给 Remotion 项目（用 React 程序化做视频）的 best practices——音视频时长 / 帧率 / Composition / useCurrentFrame / 性能 / 渲染参数等约束。Remotion 官方文档里直接引用，让 Claude Code / Cursor / Codex 在写 Remotion 工程时自动遵守。

### **小红书**

- Superpower

- openspec

- Grill\-me

- hand\-off

- Prototype

- to\-prd

- Self\-improving\-agent

- find\-skills

- Summarize

- agent\-browser

- Github

- Skill\-vetter

- Tdd

- Diagnose

- Caveman

- Andrej\-karpathy\-skills

- Gstack

- Claude\-mem

- Get\-shit\-done

- Graphify

- Claude\-code\-safety\-net

- Marketingskills

- Humanizer

- Claude\-seo

- Claude\-ads

- Ui\-ux\-pro\-max\-skill

- Open\-design

- Huashu\-design

- Frontend\-slides

- Openmontage

- Scientific\-agent\-skills

- Academic\-reasearch\-skills

- Auto\-claude\-code\-research\-in\-sleep

- Notebooklm\-py

- claude\-plugins\-official

- 

c	条目	形态	描述
1	Superpower	仓库（14 skill）	obra/superpowers，社区事实标准的 Claude Code 软件开发方法论：brainstorming → writing-plans（拆 2-5 分钟微任务）→ subagent-driven-development（每任务派 fresh subagent + 双阶段 review）→ test-driven-development（强制 RED-GREEN-REFACTOR）→ requesting/receiving-code-review → using-git-worktrees → finishing-a-development-branch；外加 systematic-debugging、verification-before-completion、dispatching-parallel-agents、writing-skills、using-superpowers。210k 星，跨 Claude Code / Codex CLI / Codex App / Factory Droid / Gemini CLI / OpenCode / Cursor / Copilot CLI 8 个 host。
2	openspec	工具 + skill 包	Fission-AI/OpenSpec，spec-driven development 框架：openspec init 把"提议变更 → 评审 → 归档"流程接入 Claude Code / Cursor / Codex 等。比 Kiro 更轻、不锁定 IDE。本质是 CLI 工具 + 配套 SKILL.md，不是单 SKILL.md。
3	Grill-me	子 skill（mattpocock/skills 内）	mattpocock/skills/skills/productivity/grill-me/。"逼问"模式：让 Claude 反过来逐个分支盘问你的计划，直到所有决策树压力测试一遍才停。Reddit 病毒级口碑——证明 spec-to-code 是 vibe coding 的真相。
4	hand-off	子 skill（mattpocock/skills 内）	mattpocock/skills/skills/productivity/handoff/。把当前会话压成结构化 handoff 文档，让另一个 agent / 另一段会话能无缝接力，不再重复"跟下一个 Claude 解释一遍上下文"。
5	Prototype	子 skill（mattpocock/skills 内）	mattpocock/skills/skills/engineering/prototype/。写"丢弃式原型"——要么是个能跑的终端 app（探状态/业务逻辑），要么是同一路由下几个差异巨大的 UI 变体让你比选；目的是减少在真实代码里返工。
6	to-prd	子 skill（mattpocock/skills 内）	mattpocock/skills/skills/engineering/to-prd/。把当前对话上下文直接合成 PRD 并提交成 GitHub issue；不再额外问问题，只综合已经讨论过的内容；Matt 自己最常用的"对话→工单"工具。
7	Self-improving-agent	子 plugin（alirezarezvani/claude-skills 内，含 5+2 子 skill）	alirezarezvani/claude-skills/engineering-team/self-improving-agent/。利用 Claude Code v2.1.32+ 的 auto-memory 自动记录的项目模式、debug 经验、纠正历史，做模式提升（pattern promotion）、skill 抽取、记忆健康检查；让 agent 边用边自我精炼。
8	find-skills	子 skill（vercel-labs/skills 内）	vercel-labs/skills/skills/find-skills/。npx skills 工具自带的发现/安装 skill：让 Claude 主动到开放 skill 生态里找匹配主题的 skill 并装上。Shadowing 规则：浅层 SKILL.md 覆盖嵌套同名。
9	agent-browser	仓库（CLI + 1 skill）	vercel-labs/agent-browser。Vercel 出的浏览器自动化 CLI（基于 Chrome DevTools Protocol），让 agent 能导航 / 填表 / 点击 / 截图 / 抓数据。安装时往 .claude/skills/agent-browser/SKILL.md 放一个 discovery stub 让 Claude 知道有这个 CLI。
10	Skill-vetter	子 skill（UseAI-pro/openclaw-skills-security 内）	仓库含 skill-auditor + skill-vetter 两个 skill。装 OpenClaw / Claude skill 之前先做安全审计：分析 metadata、权限范围、代码内容是否有恶意行为；类似 npm audit 但针对 skill。
11	Tdd	子 skill（多家同名）	mattpocock/skills/skills/engineering/tdd/（最常被引用版）；obra/superpowers 和 alirezarezvani/claude-skills 也有自己的 TDD skill。三家风格不同：Matt 的最轻、Superpowers 的最严格（强制 RED-GREEN-REFACTOR）、alirezarezvani 的最大（带 coverage 分析 + framework 集成）。
12	Diagnose	子 skill（mattpocock/skills 内）	mattpocock/skills/skills/engineering/diagnose/。调试 / 性能回归专用循环：复现 → 最小化 → 假设 → 注入观测 → 修 → 回归测试。"硬 bug" 处理标准流程。
13	Caveman	单 skill	JuliusBrussee/caveman。一夜爆红的"穴居人模式"：把 Claude 输出风格压到极简——drop 所有 filler、保留完整技术准确度，实测可省 ~75% token；mattpocock/skills 内的 caveman 是同源思路的姊妹版。
14	Andrej-karpathy-skills	不是 skill（CLAUDE.md 模板）	multica-ai/andrej-karpathy-skills，仓库里只有一个 CLAUDE.md 文件——把 Karpathy 在 X 上发的 4 条编程行为约束（防止常见 LLM 编码陷阱）固化成行为约束。技术上不是 Agent Skill，是 CLAUDE.md prompt 模板，但社区一致把它放在 skill 列表里。
15	Gstack	仓库（6 skill）	garrytan/gstack，YC CEO Garry Tan 个人 Claude Code 配置开源版：含 /office-hours、/landing 等 6 个 slash command/skill，把他每周写 10K+ 行的工作流公开。是"创始人个人工作流 → skill 包"的代表作。
16	Claude-mem	仓库（CLI + MCP + skill）	thedotmack/claude-mem，Claude Code 的"持久记忆"系统：spawn 一个影子 Sonnet 跟随主会话写 observations，4 个 MCP tool 做 token 高效的 3 层记忆工作流（search → context → recall）；mem-search skill 自动 invoke——你问"上次怎么调那个 bug"它就找出来。45k+ 星。
17	Get-shit-done	仓库（轻量 SDD 框架）	gsd-build/get-shit-done，"TÂCHES"出的轻量 spec-driven 系统，把 meta-prompt + context engineering + SDD 串成统一框架，对标 BMAD/Spec-Kit 但更精简、不抢你掌控权；社区也有它的 SKILL.md 化 fork（ctsstc/get-shit-done-skills）。
18	Graphify	单 skill	safishamsi/graphify。/graphify 命令把整个项目（代码 / 文档 / PDF / 图片 / 视频）映射成可查询的知识图谱，让 Claude 在跨文件推理时不需要每次重新搜。32k 星，250k+ PyPI 下载。
19	Claude-code-safety-net	plugin（不是 skill）	kenryu42/claude-code-safety-net，Claude Code plugin（不走 Agent Skills 标准）：hook 进 PreToolUse 事件，在 Claude 跑危险 git/filesystem 命令前拦截（git push --force / reset --hard / rm -rf / clean -f 等），等你确认才放行。
20	Marketingskills	仓库（41 skill）	coreyhaines31/marketingskills，Corey Haines（Swipe Files / Conversion Factory）出的营销 skill 包：CRO、文案、SEO、分析、增长工程；最被引用的营销 skill 包之一，你之前已经看过这家全表。
21	Humanizer	单 skill	blader/humanizer。检测并改写"AI 味"文本：drop 常见 AI 模板词、补节奏变化、提高自然度，让 LLM 输出读起来不像 LLM 写的。同款也镜像在 softaworks/agent-toolkit。
22	Claude-seo	仓库（25 skill + 13 sub-agent + 17 脚本）	AgriciDaniel/claude-seo。全站 SEO 审计 + 修复：on-page 优化、技术 SEO、结构化数据校验、Search Console / PageSpeed Insights / Google Ads API 集成；可直接把 meta tag、schema markup、关键词出价改动 ship 到源码或 CMS。
23	Claude-ads	仓库（多 skill）	AgriciDaniel/claude-ads，同作者另一个仓库。付费广告审计 skill：Google Ads / Meta Ads 全账户 audit，资深 PPC 人手要 4-6 小时的活让 agent 跑完。
24	Ui-ux-pro-max-skill	单 skill	nextlevelbuilder/ui-ux-pro-max-skill，跨平台 UI/UX 设计智能：写组件库 / 视觉风格 / 多平台适配时的设计指导原则。被 Snyk 列进"UI/UX 工程师 Top 8 Claude skill"。
25	Open-design	仓库（19 skill）	nexu-io/open-design，Claude Design 的本地化开源平替：local-first、BYOK、支持 16 个 coding-agent CLI；交互式目录两个 mode，其中 prototype 模式自带 32 个子 skill（任何能渲成单页 artifact 的东西——杂志风落地页、动画、原型）；自家定义了 SKILL.md 协议扩展。
26	Huashu-design	单 skill	alchaincyf/huashu-design，花叔（alchaincyf）出的"HTML-native 设计 skill"：高保真原型 / 幻灯片 / 动画 + 20 设计哲学 + 5 维评审 + MP4 导出；用 HTML 当万能设计画布。同作者另有 huashu-skills（21 个内容创作 skill：AI 审校 / 选题生成 / 视频脚本拆解等）。
27	Frontend-slides	单 skill	zarazhangrui/frontend-slides，零依赖单 HTML 演示：1920×1080 固定 stage、12 视觉风格预设、bold-template-pack 可视化预览卡（progressive disclosure 选模板）、可把 PPTX 转 web、导出 PDF（Playwright）、部署 Vercel。19.3k 星。
28	Openmontage	仓库（agentic 视频生产系统）	calesthio/OpenMontage，自称"世界第一个开源 agentic 视频生产引擎"：可纯生成图片视频（Ken Burns 动效 + 配音 + 字幕）、也可剪真视频；目标让 Claude 用 0 成本做纪录片 / 广告。Reddit 上多次刷屏。
29	Scientific-agent-skills	仓库（多 skill）	K-Dense-AI/scientific-agent-skills（旧名 claude-scientific-skills）。给科研 / 工程 / 分析 / 金融 / 写作的 agent skill 集；含 literature-review 等多个 skill，背后串了 50+ 开源科研项目。
30	Academic-research-skills	仓库（多 skill）	imbad0202/academic-research-skills（Codex 版另开仓库 -codex）。学术研究全流程 skill：research → write → review → revise → finalize，HN 上 82 分。
31	Auto-claude-code-research-in-sleep	仓库（多 skill，社区简称 ARIS）	wanshuiyin/Auto-claude-code-research-in-sleep。"睡觉时让 Claude Code 帮你做研究"：搭好 schedule + skill 组合，AI 在你不在线时长跑 research / 调研 / 总结。10.8k+ 星。
32	Notebooklm-py	仓库（Python 库 + skill）	teng-lin/notebooklm-py，非官方 NotebookLM Python API + 综合 skill：让 Claude Code 全权控制 NotebookLM（创 notebook、上传 source、查询、生成 audio）；纯 async Python，无需 OAuth。衍生品 claude-world/notebooklm-skill 也基于它。和你前面看过的 PleasePrompto/notebooklm-skill（浏览器自动化）是两条不同实现路线。
33	claude-plugins-official	仓库（plugin marketplace）	anthropics/claude-plugins-official，Anthropic 官方维护的 Claude Code plugin marketplace。装的是 plugin 不是 skill——/plugin install <name>@claude-plugins-official；含 28+ 个 Anthropic 自营高质量 plugin。同体系还有 anthropics/claude-plugins-community（社区版）和 anthropics/knowledge-work-plugins（角色化）。

