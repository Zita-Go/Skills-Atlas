'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadData } = require('../src/data');
const { buildIndices } = require('../src/index-build');
const gaps = require('../src/commands/gaps');
const { flatRows } = buildIndices(loadData({ quiet: true }).data);

test('gaps.candidatePool: aggregated activity surfaces relevant skills, excludes installed/dismissed', () => {
  const recent = [
    { text: 'help me debug this crash' }, { text: 'reproduce the null pointer' },
    { text: 'why does it panic here' }, { text: 'find the root cause of the bug' },
  ];
  const pool = gaps.candidatePool(flatRows, recent, {});
  assert.ok(pool.some(c => c.skill === 'systematic-debugging'), `debugging activity → systematic-debugging (got ${pool.map(c => c.skill)})`);
  const filtered = gaps.candidatePool(flatRows, recent, { installed: new Set(['systematic-debugging']), dismissed: ['diagnose'] });
  assert.ok(!filtered.some(c => c.skill === 'systematic-debugging'), 'installed excluded');
  assert.ok(!filtered.some(c => c.skill === 'diagnose'), 'dismissed excluded');
});

test('gaps.analysisPrompt: includes activity, candidates, a NONE escape, dismissed, and the language', () => {
  const recent = [{ text: 'debug the crash' }, { text: 'fix the heisenbug' }];
  const p = gaps.analysisPrompt(recent, [{ skill: 'systematic-debugging', use: 'root cause' }], ['legal-x'], 'zh');
  assert.match(p, /debug the crash/);
  assert.match(p, /systematic-debugging/);
  assert.match(p, /\bNONE\b/);
  assert.match(p, /简体中文/);
  assert.match(p, /legal-x/);
});

test('gapstate: pending write/clear round-trip', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-pend-'));
  const saved = process.env.XDG_CACHE_HOME;
  process.env.XDG_CACHE_HOME = path.join(home, 'cache');
  delete require.cache[require.resolve('../src/gapstate')];
  try {
    const g = require('../src/gapstate');
    assert.strictEqual(g.read().pending, undefined);
    g.writePending({ text: 'hi', source: 'm' });
    const p = g.read().pending;
    assert.strictEqual(p.text, 'hi');
    assert.ok(p.at, 'stamps a timestamp');
    g.clearPending();
    assert.strictEqual(g.read().pending, undefined);
  } finally {
    if (saved === undefined) delete process.env.XDG_CACHE_HOME; else process.env.XDG_CACHE_HOME = saved;
    delete require.cache[require.resolve('../src/gapstate')];
  }
});
