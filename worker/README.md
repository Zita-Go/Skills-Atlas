# Skills Atlas LLM Proxy (Cloudflare Worker)

把 OpenRouter API key 放后端 worker，前端只调 worker。访客零配置就能用 LLM
推荐，但 key 不暴露。

## 为什么要 worker

GitHub Pages 是静态托管，没有后端。如果把 OpenRouter key 直接嵌入
`docs/index.html`，会被 GitHub secret scanning 拦下来推不上去（即使绕过，key
也会被任何访客 F12 看到）。

OpenRouter 本身没有 referer / origin 限制功能。所以最干净的做法是：

```
浏览器 ──── Cloudflare Worker ──── OpenRouter
   (没 key)    (env 里有 key)       (上游)
```

worker 的防护：

- **Origin 白名单**：只接受来自 `ALLOWED_ORIGINS` 的请求
- **模型白名单**：只允许 4 个 `:free` 模型，防止有人改成付费模型烧账
- **限速**：单 IP 10 次/分钟（in-memory，简易兜底）

## 部署

只需要一次。用 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)。

### 1. 装 wrangler

```bash
npm install -g wrangler
wrangler login   # 浏览器登录 Cloudflare 账号
```

### 2. 配置 key（用 secret，不写在文件里）

```bash
cd worker
wrangler secret put OPENROUTER_KEY
# 提示输入时粘贴 sk-or-v1-... 然后回车
```

### 3. 部署

```bash
wrangler deploy
```

成功输出形如：

```
Published skills-atlas-llm
  https://skills-atlas-llm.<your-subdomain>.workers.dev
```

把这个 URL（加上 `/v1/chat/completions`）填到 `scripts/templates/index.html.tmpl`
里的 `SITE_DEFAULT_LLM.proxyUrl`，再 `python3 scripts/gen_html.py` 重新生成 HTML
就行。

### 4. 健康检查

```bash
curl https://skills-atlas-llm.<your-subdomain>.workers.dev/
# 应返回 {"ok":true,"service":"skills-atlas-llm-proxy"}
```

## 换 key / 换 origin

```bash
# 换 OpenRouter key
wrangler secret put OPENROUTER_KEY

# 换 origin（编辑 wrangler.toml 里 ALLOWED_ORIGINS 后重新 deploy）
wrangler deploy
```

## 用量限制

Cloudflare Worker 免费层每天 100k 次调用、CPU 时间 10ms/次，足够本站。
更详细参见 [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)。
