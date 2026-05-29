# Skills Atlas Curator — Worker B

「造目录的引擎」。每天 Cron 跑：发现新 skill 候选 → LLM 过滤(PR-2) → LLM 起草(PR-3)
→ 向主库开 PR。付费 key 与写权限都只在这个 Worker 里，**不进公共仓库的 Actions secrets**。

和 `../worker/`（Worker A，对公网开放的前端推荐代理）**分开部署**——blast radius 隔离：
A 被滥用顶多刷免费模型，碰不到这里的 `GITHUB_PAT`。

```
Cron(每天 02:00 UTC)
  └─ scheduled() → runCuration()
       ① 拉公共库 discovery.config.yaml / repositories.yaml / blocklist.yaml + KV SEEN
       ② GitHub Search → 候选，剔除 known ∪ blocklist ∪ SEEN
       ③ LLM is-skill 过滤（config.llm 故障转移链）
       ④ LLM 起草 type / 分类 / 中文描述
       ⑤ 开 PR：草稿写 data/_inbox/proposed/<date>.json + 候选写 KV SEEN(带 TTL)
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
wrangler secret put OPENROUTER_KEY   # 和 Worker A 同一把 OpenRouter key
wrangler secret put GITHUB_PAT       # 细粒度 PAT，scope 仅 Zita-Go/Skills-Atlas
                                     #   权限：Contents:write · Pull requests:write · Issues:write
wrangler secret put TRIGGER_SECRET   # 手动 /run 触发口令（随机长串）

# 3) 部署
wrangler deploy
```

## 测试

```bash
# 本地跑一次定时逻辑（不会真改 GitHub，除非配了真 PAT）
npm run dev   # wrangler dev --test-scheduled

# 线上手动触发一轮（需带 token）
curl -X POST "https://skills-atlas-curator.<subdomain>.workers.dev/run?token=$TRIGGER_SECRET"

# 看日志
npm run tail
```

## 安全要点

- `GITHUB_PAT` 用**细粒度** token，仓库范围只勾 `Zita-Go/Skills-Atlas`，权限最小化到
  Contents / Pull requests / Issues 写。**绝不**用经典 PAT 或全账号范围。
- `fetch()` 的 `/run` 入口靠 `TRIGGER_SECRET` 鉴权；没配 secret 一律 403。Cron 是主路径。
- LLM 全走 `:free` 模型；`OPENROUTER_KEY` 即使泄漏，损失也被免费层 + 模型链兜住。
- curator **从不**直接写 `data/skills.yaml` / `repositories.yaml`——只写
  `data/_inbox/proposed/` 草稿并开 PR，分类/描述由人审改定后才进主数据。

## 与 Stage-1 脚本的关系

`scripts/discover_candidates.py` 是发现逻辑的**参考实现 + 本地手动跑入口**；本 Worker 用 JS
镜像了同一套发现 + 去重逻辑，并接上 LLM 与开 PR。两边读**同一份** `discovery.config.yaml`，
`FALLBACK_CONFIG`（index.js）与 `_FALLBACK`（discover_candidates.py）保持对齐。
