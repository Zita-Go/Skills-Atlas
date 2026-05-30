# Skills Atlas Curator — Worker B

「造目录的引擎」。目录【按功能整理】，所以产出的是"按功能归好类的 skill"，不是"仓库条目"。
付费 key 与写权限都只在这个 Worker 里，**不进公共仓库的 Actions secrets**。

和 `../worker/`（Worker A，对公网开放的前端推荐代理）**分开部署**——blast radius 隔离：
A 被滥用顶多刷免费模型，碰不到这里的 `GITHUB_PAT`。

```
Cron(每天 02:00 UTC)
  └─ scheduled() → runCuration()
       ① 拉公共库 discovery.config / repositories / blocklist / categories.yaml + KV SEEN
       ② GitHub Search → 候选，剔除 known ∪ blocklist ∪ SEEN
       ③ 抽取：读每个仓库文件树，枚举 SKILL.md
              （没有 SKILL.md = 非来源/聚合清单/文档 → 剔除，记 no_skill_files）
       ④ 分类：一次 LLM 把仓库里的 skill 按功能归到 74 个子分类（宁可新开组）
       ⑤ 开 PR：草稿写 data/_inbox/proposed/<date>.json（按功能分组）+ 候选写 KV SEEN(带 TTL)
```

发现策略（查询词 / 阈值）和 LLM 模型链全部读公共库的
`data/_inbox/discovery.config.yaml`——**改策略改那份 yaml + 提 PR，不用动 Worker**。

## 部署

```bash
cd worker-curator
npm install                       # 装 js-yaml + wrangler

# 1) 建 KV namespace，把返回的 id 填进 wrangler.toml 的 [[kv_namespaces]].id
wrangler kv namespace create SEEN

# 2) 配 secrets（不要写进 wrangler.toml）
wrangler secret put OPENROUTER_KEY    # 和 Worker A 同一把 OpenRouter key
wrangler secret put GITHUB_PAT        # 【写】细粒度 PAT，scope 仅 Zita-Go/Skills-Atlas
                                      #   权限：Contents:write · Pull requests:write
                                      #   （只开 PR，不需要 Issues 权限）
wrangler secret put GITHUB_READ_TOKEN # 【读·推荐】读候选仓库文件树用。classic token 不勾
                                      #   任何 scope 即可（公开读 5000/h）。不配则回退用
                                      #   GITHUB_PAT —— 但若 PAT 只授权本库，会读不了别人的
                                      #   公开库，抽取层全 repo_error，故强烈建议单独配。
wrangler secret put TRIGGER_SECRET    # 手动 /run 触发口令（随机长串）

# 3) 部署
wrangler deploy
```

## 测试

**首次启动从 dry-run 开始**：`DRY_RUN` 在 `wrangler.toml` 里默认 `"true"`，所以刚部署时
照常发现 + 调 LLM，但**不写 KV、不开 PR**（零副作用），`/run` 的响应里 `would_propose`
会列出"它本来要提议什么"。看明白行为对了，再把 `DRY_RUN` 改成 `"false"` 重新 deploy。

`/run` 是**异步**的：它把活丢到后台（`waitUntil`，和 cron 同机制）立即返回 `started`，
所以**不受客户端超时影响**（free 模型慢也没关系）。结果写进 KV，用 `GET /result` 取。

```bash
BASE=https://skills-atlas-curator.<subdomain>.workers.dev

# 1) 触发一轮 dry-run（立即返回 {status:"started"}）
curl -X POST "$BASE/run?token=$TRIGGER_SECRET&dry_run=true&limit=5"

# 2) 过一会儿取结果（status: running → done；done 时 result 里就是整轮输出）
curl "$BASE/result?token=$TRIGGER_SECRET"

# 同步模式（小 limit + 模型快时图省事，会一直等到跑完）：加 &wait=1
curl -X POST "$BASE/run?token=$TRIGGER_SECRET&dry_run=true&limit=2&wait=1"

# 确认 OK 后真跑（开 PR）：dry_run=false，或改 wrangler.toml 的 DRY_RUN=false 再 deploy
curl -X POST "$BASE/run?token=$TRIGGER_SECRET&dry_run=false"

# 本地 / 看日志
npm run dev    # wrangler dev --test-scheduled
npm run tail
```

> dry-run 严格零副作用：既不开 PR，也**不写 KV `SEEN`** —— 否则空跑会把候选标记成"已见"，
> 真跑时反而被跳过。所以可以放心反复 dry-run。

## ⚠️ 子请求限额（Cloudflare 免费套餐）

免费套餐**单次调用最多 50 个子请求**。一轮 = 配置拉取(3) + 搜索(~10) + 每候选 2~4 次 LLM。
所以**别一次处理太多候选**，否则会报 `Too many subrequests`。

- 由 `MAX_CANDIDATES_PER_RUN`（默认 `"10"`）控制每轮 LLM 处理的候选数，超出的不写 SEEN、
  下一轮 cron 自然接着处理。
- 临时覆盖：`/run?...&limit=2`（测试时设小，秒回）。
- 想一次吃满 `daily_cap`：升级 **Workers Paid**（$5/月，1000 子请求/次），再把
  `MAX_CANDIDATES_PER_RUN` 调大或设 `"0"`（不额外限）。

```bash
# 测试：只处理前 2 个候选，几秒返回，远低于 50 子请求
curl -X POST ".../run?token=$TRIGGER_SECRET&dry_run=true&limit=2"
```

## 安全要点

- `GITHUB_PAT` 用**细粒度** token，仓库范围只勾 `Zita-Go/Skills-Atlas`，权限最小化到
  Contents / Pull requests 写（当前不需要 Issues）。**绝不**用经典 PAT 或全账号范围。
- `fetch()` 的 `/run` 入口靠 `TRIGGER_SECRET` 鉴权；没配 secret 一律 403。Cron 是主路径。
- LLM 全走 `:free` 模型；`OPENROUTER_KEY` 即使泄漏，损失也被免费层 + 模型链兜住。
- curator **从不**直接写 `data/skills.yaml` / `repositories.yaml`——只写
  `data/_inbox/proposed/` 草稿并开 PR，分类/描述由人审改定后才进主数据。

## 与 Stage-1 脚本的关系

`scripts/discover_candidates.py` 是发现逻辑的**参考实现 + 本地手动跑入口**；本 Worker 用 JS
镜像了同一套发现 + 去重逻辑，并接上 LLM 与开 PR。两边读**同一份** `discovery.config.yaml`，
`FALLBACK_CONFIG`（index.js）与 `_FALLBACK`（discover_candidates.py）保持对齐。
