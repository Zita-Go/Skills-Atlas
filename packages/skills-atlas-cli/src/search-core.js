// Tokenized search ranking for the catalog. Pure functions (no I/O) so they can
// be unit-tested directly.
//
// Why tokenized: the query is split into terms (ASCII words + CJK bigram
// shingles), a row matches if it contains ANY term, and rows are ranked by how
// many terms hit and where. This makes multi-keyword and loose natural-language
// queries work ("pdf 翻译", "translate a whole pdf") instead of requiring the
// whole string to appear as one contiguous substring.
'use strict';

// Function words / fillers that only add noise. ASCII words + single CJK chars.
const STOP = new Set([
  // English
  'i', 'me', 'my', 'we', 'our', 'us', 'you', 'your', 'a', 'an', 'the', 'to', 'of',
  'for', 'on', 'in', 'at', 'and', 'or', 'with', 'is', 'am', 'are', 'be', 'can',
  'do', 'does', 'how', 'what', 'which', 'want', 'wanna', 'need', 'please', 'help',
  'using', 'use', 'via', 'that', 'this', 'these', 'those', 'it', 'its', 'make',
  'get', 'find', 'some', 'any', 'about', 'into', 'from', 'as', 'by', 'so',
  // Chinese
  '我', '你', '您', '他', '她', '它', '们', '的', '地', '得', '了', '着', '吗', '呢',
  '吧', '啊', '把', '被', '给', '帮', '想', '要', '请', '怎', '么', '如', '何', '一',
  '个', '些', '这', '那', '可', '以', '能', '会', '用', '做', '有', '和', '与', '或',
  '在', '是', '就', '也', '都', '还', '让', '跟', '对', '向', '我们', '帮我', '我想',
]);

// Split a (lowercased) query into search terms.
function tokenize(query) {
  const out = new Set();
  const re = /[a-z0-9]+|[一-鿿]+/g;
  let m;
  while ((m = re.exec(query)) !== null) {
    const chunk = m[0];
    if (chunk.charCodeAt(0) < 0x4e00) {
      // ASCII run: keep words of length >= 2 that aren't stopwords
      if (chunk.length >= 2 && !STOP.has(chunk)) out.add(chunk);
    } else {
      const chars = [...chunk];
      if (chars.length === 1) {
        if (!STOP.has(chars[0])) out.add(chars[0]);
      } else {
        // CJK run: bigram shingles (handles run-on text with no spaces);
        // drop bigrams made entirely of stopword chars.
        for (let i = 0; i < chars.length - 1; i++) {
          const a = chars[i], b = chars[i + 1];
          if (STOP.has(a) && STOP.has(b)) continue;
          out.add(a + b);
        }
      }
    }
  }
  return [...out];
}

const lc = s => String(s || '').toLowerCase();
const joinLc = (...xs) => xs.filter(Boolean).join(' ').toLowerCase();

function buildFields(r) {
  const name = joinLc(...(r.skills || []));
  const group = joinLc(r.group, r.group_en);
  const use = joinLc(r.use_case, r.use_case_en, r.when_to_use, r.when_to_use_en);
  const desc = joinLc(r.description, r.description_en);
  return { name, group, use, desc, all: [name, group, use, desc].join(' ') };
}

const maxStars = r => Math.max(0, ...(r.sources || []).map(s => s.stars || 0));

// Does a field contain the token? Tolerates simple English plurals (tests → test).
function fieldHas(field, t) {
  if (field.includes(t)) return true;
  if (t.length > 3 && t.endsWith('s') && field.includes(t.slice(0, -1))) return true;
  return false;
}

// Relevance for one row. Returns { score, hits, coverage }. Coverage (fraction of
// query tokens matched) dominates multi-word queries, so a single common token
// can't make an unrelated row win.
function scoreRow(r, tokens, fullQuery) {
  const f = buildFields(r);
  let base = 0, hits = 0;
  for (const t of tokens) {
    let w = 0;
    if (fieldHas(f.name, t)) w = 10;        // matches a skill name
    else if (fieldHas(f.group, t)) w = 6;   // matches the group title
    else if (fieldHas(f.use, t)) w = 4;     // matches use_case / when_to_use
    else if (fieldHas(f.desc, t)) w = 2;    // matches the long description
    if (w) { base += w; hits++; }
  }
  if (!hits) return { score: 0, hits: 0, coverage: 0 };

  const coverage = hits / tokens.length;
  let score = base;
  // Exact skill-name term is a strong signal only for SHORT queries (you're
  // naming the skill). On long queries one matching token must not dominate.
  if (tokens.length <= 2) {
    const skillSet = new Set((r.skills || []).map(lc));
    for (const t of tokens) if (skillSet.has(t)) score += 50;
  }
  if (fullQuery && f.all.includes(fullQuery)) score += 30;        // whole phrase verbatim
  if (tokens.length >= 2) score *= 0.25 + 0.75 * coverage * coverage; // coverage dominates
  score += hits * 2;
  return { score, hits, coverage };
}

const loose = (hay, needle) => lc(hay).includes(lc(needle));

// English aliases → the catalog's canonical (Chinese) persona values, so the
// default-English `-p` filter actually returns results.
const PERSONA_ALIAS = {
  engineering: '工程', eng: '工程', dev: '工程', developer: '工程',
  pm: 'PM', product: 'PM',
  design: '设计', designer: '设计',
  marketing: '营销', growth: '营销', sales: '营销',
  research: '研究', researcher: '研究',
  ops: '运营', operations: '运营',
  founder: '创始人', startup: '创始人',
  'job-seeking': '求职', jobseeker: '求职', job: '求职', career: '求职',
  general: '通用',
};

function applyFilters(rows, opts) {
  let out = rows;
  if (opts.category) out = out.filter(r => loose(r._cat, opts.category) || loose(r._catEn, opts.category));
  if (opts.persona) {
    const want = PERSONA_ALIAS[lc(opts.persona)] || opts.persona;
    out = out.filter(r => (r.personas || []).some(p => loose(p, want) || loose(p, opts.persona)));
  }
  if (opts.type) out = out.filter(r => (r.sources || []).some(s => loose(s.type, opts.type)));
  if (opts.chain) out = out.filter(r => r.chain);
  return out;
}

// Filter + rank. Returns { rows, weak }: weak=true means the best match covers
// little of the query (likely not what the user meant) — callers can warn.
function runSearch(rows, opts = {}) {
  const out = applyFilters(rows, opts);
  const query = lc(opts.query).trim();
  if (!query) {
    return { rows: out.slice().sort((a, b) => maxStars(b) - maxStars(a)), weak: false };
  }
  const tokens = tokenize(query);
  if (!tokens.length) {
    return { rows: out.filter(r => buildFields(r).all.includes(query)), weak: false };
  }
  const scored = out
    .map(r => ({ r, ...scoreRow(r, tokens, query) }))
    .filter(x => x.score > 0)
    .sort((a, b) => (b.score - a.score) || (maxStars(b.r) - maxStars(a.r)));
  const weak = scored.length > 0 && tokens.length >= 2 && scored[0].coverage < 0.6;
  return { rows: scored.map(x => x.r), weak };
}

// Back-compat: just the ranked rows.
function searchRows(rows, opts = {}) {
  return runSearch(rows, opts).rows;
}

// Autopilot: pick the single best skill to proactively suggest for a free-text
// prompt, or null. Conservative on purpose — requires a STRONG, multi-signal
// match (an exact skill-name token, OR ≥2 distinct query tokens hitting the
// high-signal fields name/group/use_case), so a single common word can't
// trigger it. Skips already-installed and already-suggested skills.
function pickSuggestion(rows, prompt, { installed = new Set(), suggested = new Set() } = {}) {
  const tokens = tokenize(lc(prompt));
  if (tokens.length < 2) return null; // too vague to suggest confidently
  const inName = (name, ts) => { const n = lc(name); return ts.filter(t => n.includes(t)).length; };

  let best = null;
  for (const r of rows) {
    const f = buildFields(r);
    const skillSet = new Set((r.skills || []).map(lc));
    let nameHits = 0, otherHits = 0, exact = false;
    for (const t of tokens) {
      if (skillSet.has(t)) exact = true;
      if (fieldHas(f.name, t)) nameHits++;          // skill-name match = strongest signal
      else if (fieldHas(f.group, t) || fieldHas(f.use, t)) otherHits++;
    }
    // Require a skill-NAME signal (or an exact name token). Two ordinary words
    // co-occurring in some row's verbose prose is NOT enough — that's the noise.
    if (!exact && !(nameHits >= 1 && nameHits + otherHits >= 2)) continue;
    const score = nameHits * 15 + otherHits * 6 + (exact ? 50 : 0) + maxStars(r) / 1e7;
    if (!best || score > best.score) best = { row: r, score };
  }
  if (!best) return null;

  // pick the most on-point skill in the winning row that isn't already in play
  const cand = (best.row.skills || []).filter(s => !installed.has(s) && !suggested.has(s));
  if (!cand.length) return null;
  cand.sort((a, b) => inName(b, tokens) - inName(a, tokens));
  // the suggested skill's own name must overlap the prompt, else it's a mispick
  if (inName(cand[0], tokens) === 0) return null;
  return { skill: cand[0], row: best.row };
}

module.exports = {
  tokenize, searchRows, runSearch, scoreRow, buildFields, maxStars, pickSuggestion, PERSONA_ALIAS,
};
