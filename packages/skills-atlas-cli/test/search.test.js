'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { tokenize, searchRows, runSearch } = require('../src/search-core');
const { safeAlt, buildInfo, infoForRow, renderInfo } = require('../src/format');
const { scriptFiles } = require('../src/fsutil');
const { loadData } = require('../src/data');
const { buildIndices, suggestSkills, rowsFor } = require('../src/index-build');

const { data } = loadData({ quiet: true });
const { flatRows, skillIndex } = buildIndices(data);

// helper: which skill names does a query surface?
const skillsFor = q => new Set(searchRows(flatRows, { query: q }).flatMap(r => r.skills));
const has = (q, skill) => skillsFor(q).has(skill);

test('tokenize: ASCII words + CJK bigrams, stopwords dropped', () => {
  const t = tokenize('帮我把整本pdf翻译成中文');
  assert.ok(t.includes('pdf'), 'keeps ascii term pdf');
  assert.ok(t.includes('翻译'), 'keeps CJK bigram 翻译');
  assert.ok(t.includes('中文'), 'keeps CJK bigram 中文');
  assert.ok(!t.includes('帮我'), 'drops all-stopword bigram 帮我');
});

test('tokenize: strips leading interrogative/filler phrases (en + zh)', () => {
  assert.ok(!tokenize('如何重构代码').includes('何重'), 'no bridging bigram from the 如何 prefix');
  assert.deepStrictEqual(new Set(tokenize('如何重构代码')), new Set(tokenize('重构代码')),
    '如何… tokenizes the same as the bare query');
  assert.deepStrictEqual(new Set(tokenize('how do i translate a pdf')), new Set(tokenize('translate a pdf')));
});

test('renderRow: collapses a long skill list (+N more)', () => {
  const { renderRow } = require('../src/format');
  const row = { group: 'G', group_en: 'G', _cat: 'C', _catEn: 'C', chain: false,
    skills: Array.from({ length: 11 }, (_, i) => 'skill-' + i), sources: [] };
  const out = renderRow(row, { en: true });
  assert.match(out, /\+3 more/);
  assert.ok(!out.includes('skill-9'), 'skills beyond the cap are hidden');
});

test('recency: parses last_commit and flags stale (>1y)', () => {
  const { recency } = require('../src/format');
  const now = Date.parse('2026-06-01');
  assert.deepStrictEqual(recency('2026-05-28', now), { date: '2026-05-28', days: 4, stale: false });
  assert.strictEqual(recency('2024-01-01', now).stale, true);
  assert.strictEqual(recency(null), null);
  assert.strictEqual(recency('not-a-date'), null);
});

test('renderRow: shows recency, an installed ✓, and the install shape', () => {
  const { renderRow } = require('../src/format');
  const row = { group: 'G', group_en: 'G', _cat: 'C', _catEn: 'C', chain: false,
    skills: ['alpha', 'beta'],
    sources: [{ name: 'acme', stars: 1234, last_commit: '2026-05-20', install: { command: 'npx x' } }] };
  const vendors = { acme: { skill_docs: { alpha: 'skills/alpha/SKILL.md' } } };
  const out = renderRow(row, { en: true, installed: new Set(['alpha']), vendors });
  assert.match(out, /updated 2026-05-20/);
  assert.match(out, /alpha ✓/, 'installed skill is ticked');
  assert.match(out, /single-skill/, 'alpha has a per-skill folder → single-skill install');
});

test('perSkillBlurb: pinpoints one skill in an enumerated group description', () => {
  const { perSkillBlurb } = require('../src/format');
  const desc = 'mattpocock grill-me (interrogate your plan) + Pawel pre-mortem ("assume it failed") + Codex define-goal (rewrite vague intent into a verifiable goal)';
  assert.match(perSkillBlurb('define-goal', desc), /rewrite vague intent/);
  assert.match(perSkillBlurb('grill-me', desc), /interrogate your plan/);
  assert.strictEqual(perSkillBlurb('pre-mortem', 'one coherent sentence, no enumeration'), '', 'no " + " → fall back');
  assert.strictEqual(perSkillBlurb('webapp-testing', 'A webapp-testing + B webapp-testing (does it)'), '',
    'ambiguous (2 segments) → fall back rather than guess');
});

test('renderInfo: marks an installed skill, plain otherwise', () => {
  const info = buildInfo('brainstorming', { skillIndex, vendors: data.vendors });
  assert.match(renderInfo(info, { en: true, installed: ['global'] }), /✓ installed/);
  assert.doesNotMatch(renderInfo(info, { en: true }), /✓ installed/);
});

test('tokenize: English stopwords removed', () => {
  const t = tokenize('i want to translate a whole pdf');
  assert.ok(!t.includes('i') && !t.includes('to') && !t.includes('want'));
  assert.ok(t.includes('translate') && t.includes('pdf') && t.includes('whole'));
});

// translate-book is the canonical fixture (deusyu/translate-book).
test('C: single keyword 翻译 finds translate-book', () => {
  assert.ok(has('翻译', 'translate-book'));
});

test('A: natural-language Chinese run-on finds translate-book', () => {
  assert.ok(has('帮我把整本pdf翻译成中文', 'translate-book'));
});

test('B: natural-language English finds translate-book', () => {
  assert.ok(has('I want to translate a whole pdf into chinese', 'translate-book'));
});

test('E: multi-keyword with a space finds translate-book', () => {
  assert.ok(has('pdf 翻译', 'translate-book'));
});

test('exact skill-name term ranks the right group first', () => {
  const top = searchRows(flatRows, { query: 'brainstorming' })[0];
  assert.ok(top && top.skills.includes('brainstorming'));
});

test('filters compose: --chain returns only chains', () => {
  const rows = searchRows(flatRows, { query: '', chain: true });
  assert.ok(rows.length > 0);
  assert.ok(rows.every(r => r.chain === true));
});

test('category filter is loose (zh and en both work)', () => {
  const zh = searchRows(flatRows, { query: 'seo', category: '营销' }).length;
  const en = searchRows(flatRows, { query: 'seo', category: 'marketing' }).length;
  assert.ok(zh > 0 && en > 0);
});

test('nonsense query returns nothing', () => {
  assert.strictEqual(searchRows(flatRows, { query: 'zzqqxxnomatchhere' }).length, 0);
});

test('more matched terms ranks higher (coverage)', () => {
  // a row matching both "translate" and "book" should outrank one matching only one
  const ranked = searchRows(flatRows, { query: 'translate book' });
  assert.ok(ranked.length > 0);
  assert.ok(ranked[0].skills.includes('translate-book'));
});

// --- regression guards for the ranking / filter fixes ---

test('golden: "test driven development" tops the TDD skill', () => {
  const top = searchRows(flatRows, { query: 'test driven development' })[0];
  assert.ok(top && top.skills.includes('test-driven-development'));
});

test('golden: "ui testing" tops webapp-testing', () => {
  const top = searchRows(flatRows, { query: 'ui testing' })[0];
  assert.ok(top && top.skills.includes('webapp-testing'));
});

test('plural tolerance: "unit tests" surfaces a test skill (tests→test)', () => {
  assert.ok([...skillsFor('unit tests')].some(n => /test/.test(n)));
});

test('weak-match flag fires when the query is barely covered', () => {
  assert.strictEqual(runSearch(flatRows, { query: 'helm chart' }).weak, true);
});

test('strong query is not flagged weak', () => {
  assert.strictEqual(runSearch(flatRows, { query: 'test driven development' }).weak, false);
});

test('persona filter works in English (alias → canonical), equals Chinese count', () => {
  const en = searchRows(flatRows, { query: '', persona: 'Engineering' }).length;
  const zh = searchRows(flatRows, { query: '', persona: '工程' }).length;
  assert.ok(en > 0 && en === zh);
});

test('persona aliases Design / Marketing / Founder resolve to non-empty', () => {
  for (const p of ['Design', 'Marketing', 'Founder']) {
    assert.ok(searchRows(flatRows, { query: '', persona: p }).length > 0, p);
  }
});

test('safeAlt drops the ~/.claude/skills/skills double-nest foot-gun', () => {
  assert.strictEqual(
    safeAlt('git clone https://github.com/mattpocock/skills ~/.claude/skills/skills'), null);
  const ok = 'git clone https://github.com/obra/superpowers ~/.claude/skills/superpowers';
  assert.strictEqual(safeAlt(ok), ok);
});

test('suggestSkills: gated — no far-fetched Levenshtein noise', () => {
  const s = suggestSkills(skillIndex, 'blender');
  for (const garbage of ['linear', 'fletcher', 'teaser', 'sentry']) {
    assert.ok(!s.includes(garbage), `should not suggest ${garbage}`);
  }
});

test('suggestSkills: a typo resolves to the real skill', () => {
  assert.ok(suggestSkills(skillIndex, 'brainstoming').includes('brainstorming'));
});

test('info groups are ordered best-first (composite rank strictly non-increasing)', () => {
  const info = buildInfo('pdf', { skillIndex, vendors: data.vendors });
  assert.ok(info.groups.length > 1, 'pdf appears in multiple groups');
  const rank = g => {
    const ss = g.sources.map(s => s.stars || 0);
    return [Math.max(0, ...ss), ss.reduce((a, b) => a + b, 0), ss.length];
  };
  for (let i = 1; i < info.groups.length; i++) {
    const A = rank(info.groups[i - 1]), B = rank(info.groups[i]);
    const cmp = (A[0] - B[0]) || (A[1] - B[1]) || (A[2] - B[2]);
    assert.ok(cmp >= 0, `group ${i - 1} must rank >= group ${i}`);
  }
});

test('renderInfo: multi-group skill collapses by default, expands with --all', () => {
  const info = buildInfo('pdf', { skillIndex, vendors: data.vendors });
  assert.match(renderInfo(info, { en: true }), /other group/);
  assert.doesNotMatch(renderInfo(info, { en: true, all: true }), /other group/);
});

test('renderInfo: single-group skill has no collapse line', () => {
  const info = buildInfo('brainstorming', { skillIndex, vendors: data.vendors });
  assert.strictEqual(info.groups.length, 1);
  assert.doesNotMatch(renderInfo(info, { en: true }), /other group/);
});

test('infoForRow scopes to exactly one group (by row identity)', () => {
  const rows = rowsFor(skillIndex, 'pdf');
  const one = infoForRow('pdf', rows[0], data.vendors);
  assert.strictEqual(one.groups.length, 1);
  assert.strictEqual(one.groups[0].group, rows[0].group);
});

test('scriptFiles flags scripts, ignores docs/data', () => {
  const got = scriptFiles(['SKILL.md', 'scripts/run.sh', 'helper.cjs', 'tool.py', 'notes.txt', 'x.tsx', 'data.json']);
  assert.deepStrictEqual(got.sort(), ['helper.cjs', 'scripts/run.sh', 'tool.py', 'x.tsx'].sort());
});

test('nameWordHit: word-aware, not substring (line≠guidelines), stem/plural tolerant', () => {
  const { nameWordHit } = require('../src/search-core');
  assert.ok(!nameWordHit('brand-guidelines', 'line'), 'line must NOT match guide-LINE-s');
  assert.ok(!nameWordHit('linear', 'line'), 'line must NOT match linear (coincidental prefix)');
  assert.ok(nameWordHit('systematic-debugging', 'debug'), 'debug ~ debugging (stem)');
  assert.ok(nameWordHit('test-driven-development', 'tests'), 'tests ~ test (plural)');
  assert.ok(nameWordHit('pre-mortem', 'mortem'), 'exact segment');
});

test('suggestCandidates: a strong task prompt fires with the right skill in the shortlist', () => {
  const { suggestCandidates } = require('../src/search-core');
  const cases = [
    ['help me set up test driven development for this project', 'test-driven-development'],
    ["I need to debug this systematically, it's a heisenbug", 'systematic-debugging'],
    ['run a pre-mortem before we launch', 'pre-mortem'],
    ['translate this whole pdf into chinese', 'translate-book'],
  ];
  for (const [prompt, want] of cases) {
    const r = suggestCandidates(flatRows, prompt);
    assert.ok(r.fire, `should fire: ${prompt}`);
    assert.ok(r.candidates.some(c => c.skill === want), `${prompt} → shortlist should include ${want} (got ${r.candidates.map(c => c.skill)})`);
  }
});

test('suggestCandidates: stays silent on greetings and generic dev actions (no name anchor)', () => {
  const { suggestCandidates } = require('../src/search-core');
  for (const p of ['thanks so much, that worked', 'hi there', 'fix the typo on line 42',
                   'rename this variable to userId', 'make this page load faster',
                   'design a system for notifications', 'build the app and ship it']) {
    assert.strictEqual(suggestCandidates(flatRows, p).fire, false, `should be silent: ${p}`);
  }
});

test('suggestCandidates: never re-suggests an installed or already-suggested skill', () => {
  const { suggestCandidates } = require('../src/search-core');
  const base = suggestCandidates(flatRows, 'help me set up test driven development');
  assert.ok(base.candidates.length);
  const first = base.candidates[0].skill;
  const r = suggestCandidates(flatRows, 'help me set up test driven development', { installed: new Set([first]) });
  assert.ok(!r.candidates.some(c => c.skill === first), 'installed skill is filtered out of the shortlist');
});

test('a known ⛓ chain is detected and folder-installable', () => {
  const { skillDocPath, vendorsFor } = require('../src/index-build');
  const chain = flatRows.find(r => r.chain && (r.skills || []).includes('brainstorming'));
  assert.ok(chain, 'the core dev workflow chain exists');
  assert.ok(chain.skills.length >= 2, 'chain has multiple skills');
  const v = vendorsFor(skillIndex, 'brainstorming')[0].vendor;
  // every chain member resolves to a per-skill folder in that vendor
  for (const sk of chain.skills) assert.ok(skillDocPath(v, sk), `${sk} folder-installable`);
});
