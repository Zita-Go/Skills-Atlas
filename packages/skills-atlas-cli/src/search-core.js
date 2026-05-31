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

// Relevance score for one row against the tokens. 0 = no match.
function scoreRow(r, tokens, fullQuery) {
  const f = buildFields(r);
  let score = 0, hits = 0;
  for (const t of tokens) {
    let w = 0;
    if (f.name.includes(t)) w = 10;        // matches a skill name
    else if (f.group.includes(t)) w = 6;   // matches the group title
    else if (f.use.includes(t)) w = 4;     // matches use_case / when_to_use
    else if (f.desc.includes(t)) w = 2;    // matches the long description
    if (w) { score += w; hits++; }
  }
  if (!hits) return 0;
  const skillSet = new Set((r.skills || []).map(lc));
  for (const t of tokens) if (skillSet.has(t)) score += 50;   // exact skill-name term
  if (fullQuery && f.all.includes(fullQuery)) score += 30;    // whole phrase appears verbatim
  score += hits * 3;                                          // coverage: more terms matched ranks higher
  return score;
}

const loose = (hay, needle) => lc(hay).includes(lc(needle));

// Filter + rank rows. opts: { query, category, persona, type, chain }.
function searchRows(rows, opts = {}) {
  let out = rows;
  if (opts.category) out = out.filter(r => loose(r._cat, opts.category) || loose(r._catEn, opts.category));
  if (opts.persona) out = out.filter(r => (r.personas || []).some(p => loose(p, opts.persona)));
  if (opts.type) out = out.filter(r => (r.sources || []).some(s => loose(s.type, opts.type)));
  if (opts.chain) out = out.filter(r => r.chain);

  const query = lc(opts.query).trim();
  if (!query) {
    return out.slice().sort((a, b) => maxStars(b) - maxStars(a));
  }

  const tokens = tokenize(query);
  if (!tokens.length) {
    // query was all stopwords/punctuation — fall back to a plain substring match
    return out.filter(r => buildFields(r).all.includes(query));
  }
  return out
    .map(r => ({ r, s: scoreRow(r, tokens, query) }))
    .filter(x => x.s > 0)
    .sort((a, b) => (b.s - a.s) || (maxStars(b.r) - maxStars(a.r)))
    .map(x => x.r);
}

module.exports = { tokenize, searchRows, scoreRow, buildFields, maxStars };
