'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SAVED = { HOME: process.env.HOME, C: process.env.XDG_CONFIG_HOME, K: process.env.XDG_CACHE_HOME };
function isolate() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-prune-'));
  process.env.HOME = home;
  process.env.XDG_CACHE_HOME = path.join(home, 'cache');
  process.env.XDG_CONFIG_HOME = path.join(home, 'config');
  for (const m of ['../src/prunestate', '../src/fsutil', '../src/manifest', '../src/commands/prune']) {
    delete require.cache[require.resolve(m)];
  }
  return home;
}
function restore() {
  process.env.HOME = SAVED.HOME;
  if (SAVED.C === undefined) delete process.env.XDG_CONFIG_HOME; else process.env.XDG_CONFIG_HOME = SAVED.C;
  if (SAVED.K === undefined) delete process.env.XDG_CACHE_HOME; else process.env.XDG_CACHE_HOME = SAVED.K;
}

test('prunestate: dismiss / clear round-trip + malformed file', () => {
  isolate();
  try {
    const ps = require('../src/prunestate');
    assert.deepStrictEqual(ps.read().dismissed, []);
    ps.dismiss('terraform-test'); ps.dismiss('terraform-test'); // no dup
    assert.ok(ps.isDismissed('terraform-test'));
    assert.strictEqual(ps.read().dismissed.length, 1);
    ps.clear();
    assert.deepStrictEqual(ps.read().dismissed, []);
    fs.writeFileSync(ps.file(), '{ not json');
    assert.deepStrictEqual(ps.read().dismissed, []);
  } finally { restore(); }
});

test('prune.reviewList: excludes freshly-installed and dismissed skills', () => {
  isolate();
  try {
    const { loadData } = require('../src/data');
    const fsu = require('../src/fsutil');
    const manifest = require('../src/manifest');
    const prune = require('../src/commands/prune');
    const { data } = loadData({ quiet: true });
    const root = fsu.installTargetDir({ global: true });
    const now = Date.parse('2026-06-01T00:00:00Z');
    const daysAgo = d => new Date(now - d * 86400000).toISOString();
    manifest.record(root, { skill: 'brainstorming', installedAt: daysAgo(40) });   // old → reviewable
    manifest.record(root, { skill: 'pre-mortem', installedAt: daysAgo(2) });        // fresh → excluded
    manifest.record(root, { skill: 'translate-book', installedAt: daysAgo(60) });   // old but dismissed

    const names = prune.reviewList(data, ['translate-book'], now).map(s => s.skill);
    assert.ok(names.includes('brainstorming'), 'an old skill is reviewable');
    assert.ok(!names.includes('pre-mortem'), 'a skill installed <14d ago is excluded');
    assert.ok(!names.includes('translate-book'), 'a dismissed skill is excluded');
  } finally { restore(); }
});
