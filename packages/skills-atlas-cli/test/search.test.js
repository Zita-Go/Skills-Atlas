'use strict';

const test = require('node:test');
const assert = require('node:assert');

const { tokenize, searchRows } = require('../src/search-core');
const { loadData } = require('../src/data');
const { buildIndices } = require('../src/index-build');

const { data } = loadData({ quiet: true });
const { flatRows } = buildIndices(data);

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
