/**
 * Skills Atlas LLM Proxy (Cloudflare Worker)
 *
 * 功能：
 *  - 把前端 POST /v1/chat/completions 的请求注入 OPENROUTER_KEY 后转发到 OpenRouter
 *  - 模型白名单：只允许 4 个 :free 模型，防止有人偷请求改成付费模型烧账
 *  - 来源白名单：只接受来自 ALLOWED_ORIGINS 的请求，挡掉跨站盗用
 *  - 限速：用 Cloudflare KV 或 in-memory Map 简单按 IP 计数（10 次/分钟）
 *  - CORS：放行白名单 origin
 *
 * 部署：见 README.md
 *
 * 环境变量（在 wrangler.toml 或 dashboard secrets 设置）：
 *   OPENROUTER_KEY      OpenRouter API key（必须）
 *   ALLOWED_ORIGINS     允许的 origin 列表，逗号分隔
 *                       默认：https://zita-go.github.io
 *   MODELS_WHITELIST    允许的模型，逗号分隔（可选，留空走默认 4 个）
 */

const DEFAULT_MODELS = [
  'openai/gpt-oss-120b:free',
  'z-ai/glm-4.5-air:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'openai/gpt-oss-20b:free',
];

const DEFAULT_ALLOWED_ORIGINS = [
  'https://zita-go.github.io',
];

// 简易 IP 限速：60s 窗口，10 次/分钟
// Worker 实例间不共享，所以是 best-effort（更严格的话用 Durable Object / KV）
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 10;
const ipBuckets = new Map();

function rateLimitOk(ip) {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) || [];
  const recent = bucket.filter(t => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    ipBuckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  ipBuckets.set(ip, recent);
  // 清理过期 bucket（避免内存涨）
  if (ipBuckets.size > 10_000) {
    for (const [k, v] of ipBuckets) {
      if (v.every(t => now - t >= RATE_WINDOW_MS)) ipBuckets.delete(k);
    }
  }
  return true;
}

function corsHeaders(origin, allowed) {
  const allow = allowed.includes(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResp(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    const allowedOrigins = (env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
      .split(',').map(s => s.trim()).filter(Boolean);
    const cors = corsHeaders(origin, allowedOrigins);

    // 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // 健康检查
    if (request.method === 'GET' && url.pathname === '/') {
      return jsonResp({ ok: true, service: 'skills-atlas-llm-proxy' }, 200, cors);
    }

    // 仅接受 /v1/chat/completions POST
    if (request.method !== 'POST' || url.pathname !== '/v1/chat/completions') {
      return jsonResp({ error: { message: 'Not found', code: 404 } }, 404, cors);
    }

    // 来源校验
    if (!allowedOrigins.includes(origin)) {
      return jsonResp(
        { error: { message: 'Origin not allowed', code: 403 } },
        403, cors,
      );
    }

    // 限速
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!rateLimitOk(ip)) {
      return jsonResp(
        { error: { message: 'Rate limit exceeded (10 req/min)', code: 429 } },
        429, cors,
      );
    }

    // key 检查
    if (!env.OPENROUTER_KEY) {
      return jsonResp(
        { error: { message: 'Server misconfigured: OPENROUTER_KEY missing', code: 500 } },
        500, cors,
      );
    }

    // 解析请求体
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResp({ error: { message: 'Invalid JSON body', code: 400 } }, 400, cors);
    }

    // 模型白名单
    const whitelist = (env.MODELS_WHITELIST || DEFAULT_MODELS.join(','))
      .split(',').map(s => s.trim()).filter(Boolean);
    if (!body.model || !whitelist.includes(body.model)) {
      return jsonResp(
        {
          error: {
            message: `Model '${body.model}' not allowed. Whitelist: ${whitelist.join(', ')}`,
            code: 403,
          },
        },
        403, cors,
      );
    }

    // 转发到 OpenRouter
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.OPENROUTER_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': origin,
        'X-Title': 'Skills Atlas',
      },
      body: JSON.stringify(body),
    });

    // 把上游响应原样回传（覆盖 CORS header 即可）
    const respBody = await upstream.text();
    const respHeaders = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(cors)) respHeaders.set(k, v);
    // 防止上游 cache 控制干扰
    respHeaders.delete('content-encoding');
    respHeaders.set('Content-Type', 'application/json');
    return new Response(respBody, { status: upstream.status, headers: respHeaders });
  },
};
