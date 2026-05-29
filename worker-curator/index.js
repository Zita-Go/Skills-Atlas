/**
 * Skills Atlas Curator (Cloudflare Worker B)
 * ============================================
 * 「造目录的引擎」。每天 Cron 触发：
 *
 *   ① 从公共库拉 discovery.config.yaml / repositories.yaml / blocklist.yaml
 *      + 从 KV 读 SEEN 账本
 *   ② GitHub Search（只读）→ 原始候选，剔除 known ∪ blocklist ∪ SEEN
 *   ③ PR-2  廉价 LLM：is-skill-repo? → 丢掉非 skill
 *   ④ PR-3  起草 LLM：type / 分类 / 中文描述
 *   ⑤ 用 GITHUB_PAT 开 PR（草稿写到 data/_inbox/proposed/<date>.json）
 *      + 把候选写进 KV SEEN（带 TTL = 「推迟」语义）
 *
 * 付费 key（OPENROUTER_KEY）和写权限（GITHUB_PAT）都只在这个 Worker 里，
 * 不进公共仓库的 Actions secrets。LLM 全走 :free 模型，按 config.llm 的链做故障转移。
 *
 * 部署见 README.md。
 */
import yaml from 'js-yaml';

const GH_API = 'https://api.github.com';
const GH_RAW = 'https://raw.githubusercontent.com';
const UA = 'skills-atlas-curator';

// ===========================================================================
// 入口
// ===========================================================================

export default {
  // 定时入口（真正的生产路径）
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runCuration(env).catch((e) => {
      console.error('curation failed:', e?.stack || e);
    }));
  },

  // 手动触发 / 健康检查。持有 PAT，所以 fetch 必须鉴权，别对公网裸奔。
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/' && request.method === 'GET') {
      return json({ ok: true, service: 'skills-atlas-curator' });
    }
    if (url.pathname === '/run' && request.method === 'POST') {
      if (!env.TRIGGER_SECRET || url.searchParams.get('token') !== env.TRIGGER_SECRET) {
        return json({ error: 'forbidden' }, 403);
      }
      try {
        const result = await runCuration(env);
        return json({ ok: true, ...result });
      } catch (e) {
        return json({ ok: false, error: String(e?.message || e) }, 500);
      }
    }
    return json({ error: 'not found' }, 404);
  },
};

// ===========================================================================
// 主流程
// ===========================================================================

async function runCuration(env) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // ① 拉配置 + 已知 + blocklist
  const cfg = await loadConfig(env);
  const known = await loadRepoKeySet(env, env.REPOSITORIES_PATH);
  const blocked = await loadRepoKeySet(env, env.BLOCKLIST_PATH);
  log(`config: ${cfg.queries.length} queries · min_stars=${cfg.min_stars} · daily_cap=${cfg.daily_cap}`);
  log(`known=${known.size} blocked=${blocked.size}`);

  // ② 发现 + 三方去重（known ∪ blocklist ∪ SEEN）
  const since = sinceDate(cfg.pushed_within_days);
  const seenMap = new Map(); // key -> candidate
  const rejected = {};
  for (const q of cfg.queries) {
    const query = q.template.replaceAll('{since}', since).replaceAll('{min_stars}', String(cfg.min_stars));
    const items = await githubSearch(env, query, cfg.per_query_max);
    log(`[${q.label}] ${items.length} repos`);
    for (const item of items) {
      const cand = normalizeCandidate(item, q.label);
      if (!cand.author || !cand.repo) continue;
      const key = `${cand.author.toLowerCase()}/${cand.repo.toLowerCase()}`;
      if (known.has(key)) { bump(rejected, 'already_in_repos_yaml'); continue; }
      if (blocked.has(key)) { bump(rejected, 'blocklisted'); continue; }
      if (await isSeen(env, key)) { bump(rejected, 'seen_recently'); continue; }
      const [ok, reason] = isAcceptable(cand, cfg.min_stars);
      if (!ok) { bump(rejected, reason); continue; }
      if (seenMap.has(key)) {
        const prev = seenMap.get(key);
        prev.matched_query = [...new Set([...prev.matched_query.split(','), cand.matched_query])].sort().join(',');
      } else {
        seenMap.set(key, cand);
      }
    }
  }

  let candidates = [...seenMap.values()].sort((a, b) => b.stars - a.stars);
  const truncated = candidates.length > cfg.daily_cap;
  if (truncated) candidates = candidates.slice(0, cfg.daily_cap);
  log(`candidates after dedup: ${candidates.length}${truncated ? ' (truncated)' : ''}`);

  if (candidates.length === 0) {
    return { today, candidates: 0, proposed: 0, rejected, pr: null };
  }

  // ③ + ④ 逐个候选过 LLM：先 is-skill 过滤，留下来的再起草
  const proposals = [];
  for (const cand of candidates) {
    const verdict = await filterIsSkill(env, cfg.llm, cand);
    if (!verdict.is_skill) {
      bump(rejected, 'llm_not_skill');
      // 非 skill 的也写 SEEN，省得明天再花 LLM 钱重判
      await markSeen(env, candKey(cand), { stage: 'filtered_out', reason: verdict.reason });
      continue;
    }
    let draft = null;
    try {
      draft = await draftSkill(env, cfg.llm, cand);
    } catch (e) {
      log(`draft failed for ${candKey(cand)}: ${e}`);
    }
    proposals.push({ ...cand, llm: { ...verdict, ...(draft || {}), drafted: !!draft } });
    await markSeen(env, candKey(cand), { stage: 'proposed' });
  }

  log(`proposals: ${proposals.length}`);
  if (proposals.length === 0) {
    return { today, candidates: candidates.length, proposed: 0, rejected, pr: null };
  }

  // ⑤ 开 PR：草稿落到 proposed/<date>.json，PR body 给人审勾选
  const prUrl = await openProposalPR(env, today, proposals, { rejected, truncated });
  return { today, candidates: candidates.length, proposed: proposals.length, rejected, pr: prUrl };
}

// ===========================================================================
// 配置 / 数据读取（从公共库 raw 拉，公共仓库无需鉴权）
// ===========================================================================

async function fetchRepoText(env, path) {
  const url = `${GH_RAW}/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/${env.GITHUB_BRANCH}/${path}`;
  const resp = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!resp.ok) throw new Error(`fetch ${path} -> HTTP ${resp.status}`);
  return resp.text();
}

// 和 discover_candidates.py 的 _FALLBACK 对齐：配置缺失/损坏时的安全网
const FALLBACK_CONFIG = {
  per_query_max: 50,
  daily_cap: 60,
  pushed_within_days: 90,
  min_stars: 30,
  queries: [
    { label: 'topic-claude-skills', template: 'topic:claude-skills stars:>{min_stars} pushed:>{since}' },
  ],
  llm: {
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    models: ['openai/gpt-oss-120b:free', 'z-ai/glm-4.5-air:free'],
    fallback_on: [429, 500, 502, 503, 504, 'empty'],
    max_retries_per_model: 1,
    timeout_s: 60,
  },
};

async function loadConfig(env) {
  let raw = {};
  try {
    raw = yaml.load(await fetchRepoText(env, env.CONFIG_PATH)) || {};
  } catch (e) {
    log(`⚠️ 读取 ${env.CONFIG_PATH} 失败（${e}），用内置兜底`);
  }
  const cfg = {
    per_query_max: int(raw.per_query_max, FALLBACK_CONFIG.per_query_max),
    daily_cap: int(raw.daily_cap, FALLBACK_CONFIG.daily_cap),
    pushed_within_days: int(raw.pushed_within_days, FALLBACK_CONFIG.pushed_within_days),
    min_stars: int(raw.min_stars, FALLBACK_CONFIG.min_stars),
    queries: normalizeQueries(raw.queries) || FALLBACK_CONFIG.queries,
    llm: { ...FALLBACK_CONFIG.llm, ...(raw.llm || {}) },
  };
  if (!cfg.llm.models?.length) cfg.llm.models = FALLBACK_CONFIG.llm.models;
  return cfg;
}

function normalizeQueries(arr) {
  if (!Array.isArray(arr)) return null;
  const out = arr
    .map((q) => (q && q.label && q.template ? { label: String(q.label), template: String(q.template) } : null))
    .filter(Boolean);
  return out.length ? out : null;
}

// repositories.yaml / blocklist.yaml → Set("author/repo" 小写)
async function loadRepoKeySet(env, path) {
  const set = new Set();
  let list = [];
  try {
    list = yaml.load(await fetchRepoText(env, path)) || [];
  } catch (e) {
    log(`⚠️ 读取 ${path} 失败（${e}），按空处理`);
  }
  for (const r of Array.isArray(list) ? list : []) {
    const a = (r?.author || '').toLowerCase();
    const n = (r?.repo || '').toLowerCase();
    if (a && n) set.add(`${a}/${n}`);
  }
  return set;
}

// ===========================================================================
// KV SEEN 账本（去重 + 「推迟」TTL）
// ===========================================================================

function candKey(c) { return `${c.author.toLowerCase()}/${c.repo.toLowerCase()}`; }

async function isSeen(env, key) {
  if (!env.SEEN) return false;
  return (await env.SEEN.get(`seen:${key}`)) !== null;
}

async function markSeen(env, key, meta) {
  if (!env.SEEN) return;
  const ttlDays = int(env.SEEN_TTL_DAYS, 90);
  const opts = ttlDays > 0 ? { expirationTtl: ttlDays * 86400 } : {};
  await env.SEEN.put(`seen:${key}`, JSON.stringify({ at: new Date().toISOString(), ...meta }), opts);
}

// ===========================================================================
// 发现（GitHub Search）—— 镜像 discover_candidates.py 的逻辑
// ===========================================================================

function sinceDate(days) {
  const d = new Date(Date.now() - days * 86400 * 1000);
  return d.toISOString().slice(0, 10);
}

async function githubSearch(env, query, maxItems) {
  const items = [];
  let page = 1;
  while (items.length < maxItems) {
    const pageSize = Math.min(50, maxItems - items.length);
    const url = `${GH_API}/search/repositories?q=${encodeURIComponent(query)}`
      + `&sort=stars&order=desc&per_page=${pageSize}&page=${page}`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${env.GITHUB_PAT}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!resp.ok) { log(`  ⚠️ search HTTP ${resp.status}`); break; }
    const data = await resp.json();
    const batch = data.items || [];
    items.push(...batch);
    if (batch.length < pageSize) break;
    page += 1;
  }
  return items.slice(0, maxItems);
}

function normalizeCandidate(item, label) {
  const full = item.full_name || '';
  const [author, repo] = full.includes('/') ? [full.split('/')[0], full.split('/').slice(1).join('/')] : ['', ''];
  const lic = item.license || {};
  return {
    author, repo, full_name: full,
    url: item.html_url || `https://github.com/${full}`,
    stars: item.stargazers_count || 0,
    forks: item.forks_count || 0,
    pushed_at: (item.pushed_at || '').slice(0, 10),
    created_at: (item.created_at || '').slice(0, 10),
    default_branch: item.default_branch || 'main',
    github_description: item.description || '',
    topics: item.topics || [],
    language: item.language || '',
    license: (lic && typeof lic === 'object' ? lic.spdx_id : '') || '',
    is_fork: !!item.fork,
    archived: !!item.archived,
    disabled: !!item.disabled,
    matched_query: label,
  };
}

function isAcceptable(c, minStars) {
  if (c.is_fork) return [false, 'fork'];
  if (c.archived) return [false, 'archived'];
  if (c.disabled) return [false, 'disabled'];
  if (c.stars < minStars) return [false, `stars<${minStars}`];
  return [true, ''];
}

// ===========================================================================
// LLM —— 故障转移链（config.llm.models 顺序尝试，命中 fallback_on 就降级）
// ===========================================================================

async function llmComplete(env, llm, messages, { temperature = 0, maxTokens = 600 } = {}) {
  const fallbackOn = new Set(llm.fallback_on || [429, 500, 502, 503, 504, 'empty']);
  const maxRetries = Number.isInteger(llm.max_retries_per_model) ? llm.max_retries_per_model : 1;
  const timeoutMs = (llm.timeout_s || 60) * 1000;
  let lastErr = 'no models';

  for (const model of llm.models) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const resp = await fetch(llm.endpoint, {
          method: 'POST',
          signal: ctrl.signal,
          headers: {
            Authorization: `Bearer ${env.OPENROUTER_KEY}`,
            'Content-Type': 'application/json',
            'X-Title': 'Skills Atlas Curator',
          },
          body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
        });
        if (fallbackOn.has(resp.status)) { lastErr = `${model} HTTP ${resp.status}`; continue; }
        if (!resp.ok) { lastErr = `${model} HTTP ${resp.status}`; break; } // 非可转移错误 → 跳到下个模型
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (!text) { lastErr = `${model} empty`; if (fallbackOn.has('empty')) continue; else break; }
        return { text, model };
      } catch (e) {
        lastErr = `${model} ${e?.name === 'AbortError' ? 'timeout' : e}`;
        // 超时 / 网络错误 → 重试同模型，耗尽则降级
      } finally {
        clearTimeout(timer);
      }
    }
  }
  throw new Error(`LLM 全部失败: ${lastErr}`);
}

function extractJSON(text) {
  // 容忍 ```json 围栏 / 前后噪声：抓第一个 { ... } 块
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no json object in LLM output');
  return JSON.parse(body.slice(start, end + 1));
}

// PR-2：是不是一个 skill 仓库？
async function filterIsSkill(env, llm, c) {
  const messages = [
    {
      role: 'system',
      content:
        '你是 AI Agent Skill 目录的审稿助手。判断给定 GitHub 仓库是否是一个面向 '
        + 'AI agent（Claude Code / Codex 等）的 "skill" 或 skill 集合仓库'
        + '（包含 SKILL.md / .claude/skills / 明确的 agent skill 内容）。'
        + '排除：个人 dotfiles、无关库、纯文章、与 agent skill 无关的项目。'
        + '只输出 JSON：{"is_skill": true|false, "confidence": 0-1, "reason": "一句话中文"}',
    },
    {
      role: 'user',
      content: JSON.stringify({
        full_name: c.full_name, description: c.github_description,
        topics: c.topics, language: c.language, stars: c.stars,
      }),
    },
  ];
  const { text } = await llmComplete(env, llm, messages, { maxTokens: 200 });
  try {
    const o = extractJSON(text);
    return { is_skill: !!o.is_skill, confidence: o.confidence ?? null, reason: String(o.reason || '') };
  } catch {
    // 解析失败时保守放行进人审（宁可让人看，不要静默丢）
    return { is_skill: true, confidence: null, reason: 'LLM 输出无法解析，保守放行' };
  }
}

// PR-3：起草 type / 分类 / 中文描述（仅草稿，人审定夺）
async function draftSkill(env, llm, c) {
  const messages = [
    {
      role: 'system',
      content:
        '你给 AI skill 目录起草条目元数据。基于仓库信息输出 JSON：'
        + '{"type": "skill|skill-pack|plugin|cli|...", "category": "建议大类(中文)", '
        + '"description_zh": "30-60字中文描述，说清它能帮 agent 做什么"}。只输出 JSON。',
    },
    {
      role: 'user',
      content: JSON.stringify({
        full_name: c.full_name, description: c.github_description,
        topics: c.topics, language: c.language,
      }),
    },
  ];
  const { text, model } = await llmComplete(env, llm, messages, { maxTokens: 400 });
  const o = extractJSON(text);
  return {
    type: String(o.type || ''),
    category: String(o.category || ''),
    description_zh: String(o.description_zh || ''),
    drafted_by: model,
  };
}

// ===========================================================================
// 开 PR（GitHub Contents API：建分支 → 写文件 → 开 PR）
// ===========================================================================

async function openProposalPR(env, dateStr, proposals, meta) {
  const owner = env.GITHUB_OWNER, repo = env.GITHUB_REPO, base = env.GITHUB_BRANCH;
  const branch = `curator/proposed-${dateStr}`;
  const path = `${env.PROPOSED_DIR}/${dateStr}.json`;
  const headers = {
    Authorization: `Bearer ${env.GITHUB_PAT}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': UA,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  // 1) base 分支的 sha
  const refResp = await fetch(`${GH_API}/repos/${owner}/${repo}/git/ref/heads/${base}`, { headers });
  if (!refResp.ok) throw new Error(`get base ref -> HTTP ${refResp.status}`);
  const baseSha = (await refResp.json()).object.sha;

  // 2) 建分支（已存在则忽略 422，复用）
  const mk = await fetch(`${GH_API}/repos/${owner}/${repo}/git/refs`, {
    method: 'POST', headers,
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
  });
  if (!mk.ok && mk.status !== 422) throw new Error(`create branch -> HTTP ${mk.status}`);

  // 3) 写 proposed/<date>.json（若分支上已存在该文件，带上 sha 覆盖）
  const payload = {
    generated_at: new Date().toISOString(),
    date: dateStr,
    proposed_count: proposals.length,
    meta,
    proposals,
  };
  const content = b64utf8(JSON.stringify(payload, null, 2));
  let existingSha;
  const cur = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, { headers });
  if (cur.ok) existingSha = (await cur.json()).sha;
  const put = await fetch(`${GH_API}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT', headers,
    body: JSON.stringify({
      message: `chore(curator): ${dateStr} ${proposals.length} 个候选草稿`,
      content, branch, ...(existingSha ? { sha: existingSha } : {}),
    }),
  });
  if (!put.ok) throw new Error(`put file -> HTTP ${put.status}`);

  // 4) 开 PR（已存在同 head 的 PR 则不重复开）
  const body = renderPRBody(dateStr, proposals, path);
  const pr = await fetch(`${GH_API}/repos/${owner}/${repo}/pulls`, {
    method: 'POST', headers,
    body: JSON.stringify({
      title: `[curator] ${dateStr} ${proposals.length} 个候选 skill（草稿待审）`,
      head: branch, base, body,
    }),
  });
  if (pr.ok) return (await pr.json()).html_url;
  if (pr.status === 422) { // 已有 open PR
    const list = await fetch(`${GH_API}/repos/${owner}/${repo}/pulls?head=${owner}:${branch}&state=open`, { headers });
    const arr = list.ok ? await list.json() : [];
    return arr[0]?.html_url || null;
  }
  throw new Error(`create PR -> HTTP ${pr.status}`);
}

function renderPRBody(dateStr, proposals, path) {
  const lines = [
    `# 🤖 ${dateStr} curator 候选草稿（${proposals.length} 条）`,
    '',
    `> 由 worker-curator 自动生成。**草稿仅供参考，分类/描述需人审改定后才进 \`data/skills.yaml\`。**`,
    `> 原始数据：\`${path}\``,
    '',
  ];
  proposals.forEach((p, i) => {
    const d = p.llm || {};
    lines.push(
      `### ${i + 1}. [${p.full_name}](${p.url})  ⭐ ${p.stars} · \`${p.license || '—'}\` · ${p.language || '—'}`,
      '',
      `- GitHub: ${p.github_description || '_(无)_'}`,
      `- LLM 判定: is_skill=${d.is_skill} ${d.confidence != null ? `(conf ${d.confidence})` : ''} — ${d.reason || ''}`,
      `- 草拟 type: \`${d.type || '?'}\` · 分类: \`${d.category || '?'}\``,
      `- 草拟中文描述: ${d.description_zh || '_(起草失败)_'}`,
      '',
      '- [ ] ✅ 接受 → 编辑进 `data/skills.yaml` / `data/repositories.yaml`',
      '- [ ] ❌ 拒绝 → 加 `data/_inbox/blocklist.yaml`',
      '',
    );
  });
  return lines.join('\n');
}

// ===========================================================================
// 小工具
// ===========================================================================

function int(v, def) { const n = parseInt(v, 10); return Number.isNaN(n) ? def : n; }
function bump(obj, k) { obj[k] = (obj[k] || 0) + 1; }
function log(msg) { console.log(msg); }
function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
// UTF-8 安全的 base64（GitHub Contents API 要 base64 内容）
function b64utf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
