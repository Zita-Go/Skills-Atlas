/**
 * Skills Atlas Curator (Cloudflare Worker B)
 * ============================================
 * 「造目录的引擎」。每天 Cron 触发。目录【按功能整理】，所以产出的是
 * "按功能归好类的 skill"，不是"仓库条目"：
 *
 *   ① 从公共库拉 discovery.config.yaml / repositories.yaml / blocklist.yaml
 *      / categories.yaml + 从 KV 读 SEEN 账本
 *   ② GitHub Search（只读）→ 原始候选，剔除 known ∪ blocklist ∪ SEEN
 *   ③ 抽取：读每个仓库文件树，枚举 SKILL.md（没有 = 非来源/聚合清单，剔除）
 *   ④ 分类：一次 LLM 把仓库里的 skill 按功能归到 74 个子分类（宁可新开组）
 *   ⑤ 用 GITHUB_PAT 开 PR（草稿写到 data/_inbox/proposed/<date>.json，按功能分组）
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

const RESULT_KEY = 'result:latest';

// 跑一轮并把状态写进 KV（running → done/error）。/run 和 cron 共用，
// 都靠 waitUntil 在后台跑，不受客户端超时影响。
async function runAndStore(env, opts) {
  const started_at = new Date().toISOString();
  await putResult(env, { status: 'running', started_at, dry_run: !!opts.dryRun, limit: opts.limit ?? null });
  try {
    const result = await runCuration(env, opts);
    await putResult(env, { status: 'done', started_at, finished_at: new Date().toISOString(), result });
  } catch (e) {
    await putResult(env, { status: 'error', started_at, finished_at: new Date().toISOString(), error: String(e?.message || e) });
    console.error('curation failed:', e?.stack || e);
  }
}

async function putResult(env, obj) {
  if (env.SEEN) await env.SEEN.put(RESULT_KEY, JSON.stringify(obj));
}

export default {
  // 定时入口（真正的生产路径）
  async scheduled(event, env, ctx) {
    // cron 路径默认按 DRY_RUN 环境变量：测试期设成 "true"，定时跑也不写 KV / 不开 PR。
    const dryRun = envFlag(env.DRY_RUN);
    const limit = int(env.MAX_CANDIDATES_PER_RUN, 10); // 子请求预算，见 runCuration / README
    ctx.waitUntil(runAndStore(env, { dryRun, limit }));
  },

  // 手动触发 / 健康检查。持有 PAT，所以 fetch 必须鉴权，别对公网裸奔。
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const authed = env.TRIGGER_SECRET && url.searchParams.get('token') === env.TRIGGER_SECRET;

    if (url.pathname === '/' && request.method === 'GET') {
      return json({ ok: true, service: 'skills-atlas-curator' });
    }

    // 取上一次（含正在进行的）运行结果。免疫模型慢：活在后台跑，这里只读 KV。
    if (url.pathname === '/result' && request.method === 'GET') {
      if (!authed) return json({ error: 'forbidden' }, 403);
      const raw = env.SEEN ? await env.SEEN.get(RESULT_KEY) : null;
      if (!raw) return json({ status: 'none', message: '还没运行过 /run' });
      return new Response(raw, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/run' && request.method === 'POST') {
      if (!authed) return json({ error: 'forbidden' }, 403);
      // ?dry_run=true 显式优先；没传则回落到 DRY_RUN 环境变量。
      const q = url.searchParams.get('dry_run');
      const dryRun = q !== null ? envFlag(q) : envFlag(env.DRY_RUN);
      // ?limit=N 显式优先；没传则用 MAX_CANDIDATES_PER_RUN（默认 10）。0 = 不额外限。
      const ql = url.searchParams.get('limit');
      const limit = ql !== null ? int(ql, 10) : int(env.MAX_CANDIDATES_PER_RUN, 10);

      // ?wait=1 → 老的同步模式（小 limit + 模型快时用）；默认走异步。
      if (envFlag(url.searchParams.get('wait'))) {
        try {
          const result = await runCuration(env, { dryRun, limit });
          return json({ ok: true, ...result });
        } catch (e) {
          return json({ ok: false, error: String(e?.message || e) }, 500);
        }
      }

      // 异步默认：后台跑，立即返回。结果稍后 GET /result 取。
      const started_at = new Date().toISOString();
      await putResult(env, { status: 'running', started_at, dry_run: dryRun, limit });
      ctx.waitUntil(runAndStore(env, { dryRun, limit }));
      return json({ ok: true, status: 'started', started_at, dry_run: dryRun, limit, hint: '稍后 GET /result?token=... 取结果' });
    }

    return json({ error: 'not found' }, 404);
  },
};

// ===========================================================================
// 主流程
// ===========================================================================

async function runCuration(env, { dryRun = false, limit = 0 } = {}) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  if (dryRun) log('🧪 DRY RUN —— 照常发现 + 调 LLM，但不写 KV、不开 PR（零副作用）');

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
  // 子请求预算：免费套餐每次调用上限 50 个 subrequest（搜索 + 每候选 2~4 次 LLM）。
  // limit>0 时每轮只 LLM 处理前 N 个；剩下的不写 SEEN，下一轮自然接着处理。
  const deferred = limit > 0 ? Math.max(0, candidates.length - limit) : 0;
  if (deferred > 0) candidates = candidates.slice(0, limit);
  log(`candidates after dedup: ${candidates.length}${truncated ? ' (daily_cap)' : ''}${deferred ? ` (+${deferred} 顺延下轮)` : ''}`);

  // 被 LLM 刷掉（判非 skill / 调用出错）的候选，带名字 + 理由，便于人审校准过滤器。
  const filteredOut = [];

  if (candidates.length === 0) {
    return { today, dry_run: dryRun, candidates: 0, deferred, repos_proposed: 0, skills_proposed: 0, rejected, filtered_out: filteredOut, pr: null };
  }

  // 功能分类的"槽"：13 大类 / 74 子分类（来自 categories.yaml）。一次性加载。
  const taxonomy = await loadTaxonomy(env);
  log(`taxonomy: ${taxonomy.length} 个子分类`);

  // ③ 抽取 + ④ 按功能分类：每个仓库 → 枚举它的 skill（扫 SKILL.md）→ 一次 LLM 批量归类。
  // 没有 SKILL.md 的仓库（含 awesome 聚合清单 / 文档 / 工具）不当来源收，记 no_skill_files。
  // 单仓库失败（含撞子请求上限）只记 repo_error 跳过，不拖垮整批。
  const proposals = []; // 每项 = { repo, skills: [classified...] }
  for (const cand of candidates) {
    try {
      const skillFiles = enumerateSkills(await fetchRepoTree(env, cand));
      if (skillFiles.length === 0) {
        bump(rejected, 'no_skill_files');
        filteredOut.push({
          full_name: cand.full_name, stars: cand.stars,
          reason: '无 SKILL.md / .claude/skills —— 非原始来源（可能是聚合清单/文档/工具）',
        });
        if (!dryRun) await markSeen(env, candKey(cand), { stage: 'no_skill_files' });
        continue;
      }
      const { is_collection, collection_reason, skills } = await classifyRepoSkills(env, cfg.llm, cand, skillFiles, taxonomy);
      if (!is_collection) {
        // 有 SKILL.md 但只是教程/演示/模板（玩具示例）→ 不当来源收
        bump(rejected, 'not_a_collection');
        filteredOut.push({
          full_name: cand.full_name, stars: cand.stars,
          skill_files: skillFiles.length,
          reason: `非正经集合（教程/演示/模板）：${collection_reason || '玩具示例'}`,
        });
        if (!dryRun) await markSeen(env, candKey(cand), { stage: 'not_a_collection' });
        continue;
      }
      proposals.push({ repo: cand, skills });
      if (!dryRun) await markSeen(env, candKey(cand), { stage: 'proposed', skills: skills.length });
    } catch (e) {
      // 不写 SEEN —— 让它下一轮还能再试
      bump(rejected, 'repo_error');
      filteredOut.push({ full_name: cand.full_name, stars: cand.stars, reason: `error: ${String(e?.message || e)}` });
      log(`repo ${candKey(cand)} failed: ${e}`);
    }
  }

  const skillsProposed = proposals.reduce((n, p) => n + p.skills.length, 0);
  log(`proposals: ${proposals.length} 仓库 / ${skillsProposed} skill`);
  if (proposals.length === 0) {
    return { today, dry_run: dryRun, candidates: candidates.length, deferred, repos_proposed: 0, skills_proposed: 0, rejected, filtered_out: filteredOut, pr: null };
  }

  // 把每个 skill 拍平成功能维度的一条，给 dry-run 输出 / PR body 用。
  const flatSkills = () => proposals.flatMap((p) => p.skills.map((s) => ({
    skill: s.name, source: p.repo.full_name, stars: p.repo.stars,
    subcategory: s.subcategory, subcategory_title: s.subcategory_title,
    group: s.group, description_zh: s.description_zh,
  })));

  // ⑤ 开 PR：草稿落到 proposed/<date>.json，PR body 按功能分组给人审
  if (dryRun) {
    log(`🧪 DRY RUN —— 跳过开 PR；本应提议 ${skillsProposed} 个 skill（见 would_propose）`);
    return {
      today, dry_run: true,
      candidates: candidates.length, deferred,
      repos_proposed: proposals.length, skills_proposed: skillsProposed,
      rejected, pr: null,
      would_propose: flatSkills(),
      filtered_out: filteredOut,
    };
  }
  const prUrl = await openProposalPR(env, today, proposals, { rejected, truncated });
  return {
    today, dry_run: false,
    candidates: candidates.length, deferred,
    repos_proposed: proposals.length, skills_proposed: skillsProposed,
    rejected, filtered_out: filteredOut, pr: prUrl,
  };
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
    const resp = await fetch(url, { headers: ghAuth(readToken(env)) });
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

// 运维健壮性参数走代码常量（不走 yaml）：超时/重试是"快速失败"策略，不是发现策略。
// 单次调用最多 25s，且不在同模型重试 —— 失败就立刻降级/跳过，避免一个仓库拖垮整批。
const LLM_TIMEOUT_MS = 25_000;
const LLM_MAX_RETRIES = 0;

async function llmComplete(env, llm, messages, { temperature = 0, maxTokens = 600 } = {}) {
  const fallbackOn = new Set(llm.fallback_on || [429, 500, 502, 503, 504, 'empty']);
  const maxRetries = LLM_MAX_RETRIES;
  const timeoutMs = LLM_TIMEOUT_MS;
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

// ===========================================================================
// 抽取：读仓库文件树 → 枚举 SKILL.md（一个仓库一次 tree 请求）
// ===========================================================================

const SKILL_CAP = 60; // 单仓库最多枚举多少 skill，给分类 prompt 与提案体封顶

function ghAuth(token) {
  return {
    'User-Agent': UA,
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// 读公开库（搜索 + 文件树）用只读 token；没配 GITHUB_READ_TOKEN 就回退到 GITHUB_PAT。
// 写权限的 GITHUB_PAT 若只授权了本库，可能读不了别人的公开库 → 这时必须配 READ_TOKEN。
function readToken(env) { return env.GITHUB_READ_TOKEN || env.GITHUB_PAT; }

async function fetchRepoTree(env, cand) {
  const branch = cand.default_branch || 'main';
  const url = `${GH_API}/repos/${cand.author}/${cand.repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const resp = await fetch(url, { headers: ghAuth(readToken(env)) });
  if (!resp.ok) throw new Error(`tree ${cand.full_name} -> HTTP ${resp.status}`);
  const data = await resp.json();
  return Array.isArray(data.tree) ? data.tree : [];
}

// 从文件树枚举 skill：每个 SKILL.md 算一个 skill，名字取其所在目录名。
// 这同时是"原始来源 vs 聚合清单"的判据 —— 聚合清单没有 SKILL.md，返回空。
function enumerateSkills(tree) {
  const out = [];
  const seenName = new Set();
  for (const node of tree) {
    if (node.type !== 'blob') continue;
    const p = node.path || '';
    if (p.split('/').pop() !== 'SKILL.md') continue; // SKILL.md 是约定文件名
    const parts = p.split('/');
    const name = parts.length >= 2 ? parts[parts.length - 2] : '(root)'; // 上级目录名
    if (seenName.has(name)) continue; // 同名 skill（不同路径/副本）只留一个，避免重复提议
    seenName.add(name);
    out.push({ name, path: p });
    if (out.length >= SKILL_CAP) break;
  }
  return out;
}

// ===========================================================================
// 分类：把仓库里的 skill 按功能归到 categories.yaml 的 74 个子分类（一仓库一次 LLM）
// ===========================================================================

// categories.yaml → 拍平成 [{id, title, category, category_title}]（74 个子分类槽）
async function loadTaxonomy(env) {
  let cats = [];
  try {
    cats = yaml.load(await fetchRepoText(env, env.CATEGORIES_PATH)) || [];
  } catch (e) {
    log(`⚠️ 读取 ${env.CATEGORIES_PATH} 失败（${e}），分类只能给空子分类`);
  }
  const subs = [];
  for (const c of Array.isArray(cats) ? cats : []) {
    for (const s of c.subcategories || []) {
      if (s?.id && s?.title) subs.push({ id: String(s.id), title: String(s.title), category: c.id, category_title: c.title });
    }
  }
  return subs;
}

// 单次 classify 最多塞多少 skill。大仓库分块跑，避免一次请求太大让 free 模型吐空/卡死。
const CLASSIFY_CHUNK = 10;

function chunkArr(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

// 编排：把仓库的 skill 分块，逐块 classify。
// is_collection 只看第一块（代表性样本）：第一块判非集合就整库剔，省掉后续块。
async function classifyRepoSkills(env, llm, cand, skillFiles, subs) {
  const chunks = chunkArr(skillFiles, CLASSIFY_CHUNK);
  let isCollection = true;
  let collectionReason = '';
  const skills = [];
  for (let i = 0; i < chunks.length; i++) {
    const r = await classifyChunk(env, llm, cand, chunks[i], subs);
    if (i === 0) { isCollection = r.is_collection; collectionReason = r.collection_reason; }
    if (!isCollection) break; // 第一块就判非正经集合 → 整库剔，不再跑后续块
    skills.push(...r.skills);
  }
  return { is_collection: isCollection, collection_reason: collectionReason, skills };
}

async function classifyChunk(env, llm, cand, skillFiles, subs) {
  const taxonomyStr = subs.map((s) => `${s.id}: ${s.title}`).join('\n');
  const messages = [
    {
      role: 'system',
      content:
        '你在帮一个【按功能整理】的 AI skill 目录给新发现的 skill 归类，同时把关质量。'
        + '目录的功能子分类（id: 标题）如下：\n' + taxonomyStr + '\n\n'
        + '第一步【仓库级判断】：这个仓库是不是一个值得收录的【正经 skill 集合】？'
        + '如果它其实是教程 / 最佳实践文档 / 演示样例 / 模板脚手架（里面的 SKILL.md 只是玩具示例，'
        + '比如 weather / time / hello-world 这类），判 is_collection=false，用一句中文说明 collection_reason，skills 留空。\n'
        + '第二步（仅当 is_collection=true）：为【每个 skill】判断它在功能上属于哪个子分类，并起一个简洁的功能"组名"。\n'
        + '分类策略：只有当 skill【明确】属于某子分类才填该 id；只是字面沾边不算'
        + '（例如"写文档/记录 ADR"不要塞进"2.1 Office 文档处理(处理 Word/PPT 文件)"）。'
        + '拿不准 / 没有明确合适的子分类时：subcategory 留空 ""，并【新开一个组】'
        + '（宁可多开，回头人工合并），绝不硬塞进勉强的子分类。\n'
        + 'description_zh 只描述能从 skill 名/路径合理推断的内容，信息不足就给一句保守概述，【绝不编造数字或细节】。\n'
        + '只输出 JSON：{"is_collection":true,"collection_reason":"一句中文","skills":[{"name":"<原样回填 skill 名>","subcategory":"4-1","group":"功能组名","description_zh":"...","what":"它能帮 agent 做什么(一句)"}]}',
    },
    {
      role: 'user',
      content: JSON.stringify({
        repo: cand.full_name,
        repo_description: cand.github_description,
        topics: cand.topics,
        skills: skillFiles.map((s) => ({ name: s.name, path: s.path })),
      }),
    },
  ];
  const { text, model } = await llmComplete(env, llm, messages, { maxTokens: 1500 });
  let o = {};
  try {
    o = extractJSON(text);
  } catch (e) {
    log(`classify parse failed for ${cand.full_name}: ${e}`);
  }
  // 仓库级判定：缺字段 / 解析失败时默认 true（保守放行进人审，不静默丢）
  const isCollection = o.is_collection !== false;
  const arr = Array.isArray(o.skills) ? o.skills : [];
  // 以仓库实际枚举到的 skill 为准，按 name 对齐 LLM 结果；子分类要在真 taxonomy 里才认。
  const byName = new Map(arr.map((x) => [String(x.name || ''), x]));
  const skills = skillFiles.map((sf) => {
    const x = byName.get(sf.name) || {};
    const sub = subs.find((s) => s.id === String(x.subcategory || ''));
    return {
      name: sf.name,
      path: sf.path,
      subcategory: sub ? sub.id : '',
      subcategory_title: sub ? sub.title : '',
      category: sub ? sub.category : '',
      group: String(x.group || ''),
      description_zh: String(x.description_zh || ''),
      what: String(x.what || ''),
      drafted_by: model,
    };
  });
  return { is_collection: isCollection, collection_reason: String(o.collection_reason || ''), skills };
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
  const nSkills = proposals.reduce((n, p) => n + p.skills.length, 0);
  const body = renderPRBody(dateStr, proposals, path);
  const pr = await fetch(`${GH_API}/repos/${owner}/${repo}/pulls`, {
    method: 'POST', headers,
    body: JSON.stringify({
      title: `[curator] ${dateStr} ${nSkills} 个 skill / ${proposals.length} 来源（按功能·草稿待审）`,
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

// 按功能（子分类）分组渲染，呼应"目录按功能整理"的定位。
function renderPRBody(dateStr, proposals, path) {
  const skills = proposals.flatMap((p) => p.skills.map((s) => ({
    ...s, source: p.repo.full_name, url: p.repo.url, stars: p.repo.stars,
  })));
  const lines = [
    `# 🤖 ${dateStr} curator 候选 skill（按功能 · 草稿待审）`,
    '',
    `> worker-curator 自动生成。**分类 / 组名 / 描述都是草稿，需人审改定后才进 \`data/skills.yaml\`。**`,
    `> 采用"宁可多开新组"策略 —— 同一功能可能拆成多条，请人工合并到合适的已有组。`,
    `> 共 ${skills.length} 个 skill / ${proposals.length} 个来源仓库 · 原始数据 \`${path}\``,
    '',
  ];
  // 按子分类标题分组
  const bySub = new Map();
  for (const s of skills) {
    const k = s.subcategory_title || '（未归入子分类）';
    if (!bySub.has(k)) bySub.set(k, []);
    bySub.get(k).push(s);
  }
  for (const [subTitle, arr] of bySub) {
    lines.push(`## ${subTitle}`, '');
    for (const s of arr) {
      lines.push(
        `- **${s.name}** — 组「${s.group || '?'}」 · 来源 [${s.source}](${s.url}) ⭐${s.stars}`,
        `  - ${s.description_zh || '_(无描述)_'}`,
      );
    }
    lines.push('');
  }
  lines.push(
    '---',
    '',
    '- [ ] 已审，接受的 skill 编辑进 `data/skills.yaml`（合并到合适的已有组 / 子分类）',
    '- [ ] 不收的来源 → 加 `data/_inbox/blocklist.yaml`',
    '',
  );
  return lines.join('\n');
}

// ===========================================================================
// 小工具
// ===========================================================================

function int(v, def) { const n = parseInt(v, 10); return Number.isNaN(n) ? def : n; }
function envFlag(v) { return /^(true|1|yes)$/i.test(String(v ?? '').trim()); }
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
