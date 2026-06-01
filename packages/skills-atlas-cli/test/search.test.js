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

test('pickSuggestion: a task-y prompt yields a confident, on-point suggestion', () => {
  const { pickSuggestion } = require('../src/search-core');
  const r = pickSuggestion(flatRows, 'help me set up test driven development for my project');
  assert.ok(r && r.skill, 'suggests a skill for a strong, multi-token match');
  assert.match(r.skill, /test|tdd/i, 'picks the on-point skill (name-weighted)');
});

test('pickSuggestion: a vague / non-task prompt suggests nothing', () => {
  const { pickSuggestion } = require('../src/search-core');
  assert.strictEqual(pickSuggestion(flatRows, 'hi there, thanks so much'), null);
});

test('pickSuggestion: common two-word phrases never mis-fire to an unrelated skill', () => {
  const { pickSuggestion } = require('../src/search-core');
  // these are ordinary task phrases that co-occur in some verbose row, but name
  // nothing — either suggest nothing, or a skill whose NAME overlaps the prompt.
  for (const p of ['improve performance', 'format the document', 'build the app',
                   'review the changes', 'design a system', 'write some tests']) {
    const r = pickSuggestion(flatRows, p);
    if (r) {
      const toks = p.toLowerCase().split(/\s+/);
      assert.ok(toks.some(t => r.skill.toLowerCase().includes(t)),
        `"${p}" → ${r.skill} must share a word with the prompt (no blind mispick)`);
    }
  }
});

test('pickSuggestion: skips already-installed skills', () => {
  const { pickSuggestion } = require('../src/search-core');
  const r1 = pickSuggestion(flatRows, 'test driven development workflow');
  assert.ok(r1);
  const r2 = pickSuggestion(flatRows, 'test driven development workflow', { installed: new Set([r1.skill]) });
  if (r2) assert.notStrictEqual(r2.skill, r1.skill, 'does not re-suggest the installed one');
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
