'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function fresh() {
  process.env.XDG_CACHE_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-fb-'));
  delete require.cache[require.resolve('../src/feedback')];
  return require('../src/feedback');
}
const NOW = Date.parse('2026-06-01T00:00:00Z');
const ev = (skill, category, signal, daysAgo = 0) =>
  ({ skill, category, signal, at: new Date(NOW - daysAgo * 86400000).toISOString() });

test('profile: accepted lifts a category, regret/dismissed suppress', () => {
  const fb = fresh();
  const p = fb.profile([
    ev('a', 'cat-x', 'accepted'), ev('b', 'cat-x', 'accepted'),
    ev('c', 'cat-y', 'regret'), ev('d', 'cat-z', 'dismissed'),
  ], NOW);
  assert.ok(p.affinity('cat-x') > 1, 'liked category lifted');
  assert.ok(p.affinity('cat-y') < 1, 'regretted category sinks');
  assert.strictEqual(p.affinity('cat-unseen'), 1, 'unseen category neutral');
  assert.ok(p.isSuppressed('c') && p.isSuppressed('d'), 'regret + dismiss suppressed');
  assert.ok(!p.isSuppressed('a'), 'accepted not suppressed');
});

test('profile: bounded multiplier + most-recent-signal wins', () => {
  const fb = fresh();
  const many = Array.from({ length: 20 }, (_, i) => ev('s' + i, 'cat', 'accepted'));
  assert.ok(fb.profile(many, NOW).affinity('cat') <= 1.4 + 1e-9, 'affinity is capped');
  const p = fb.profile([ev('x', 'c', 'dismissed', 2), ev('x', 'c', 'accepted', 0)], NOW);
  assert.ok(!p.isSuppressed('x'), 'a later accept un-suppresses');
});

test('profile: old signals decay toward neutral', () => {
  const fb = fresh();
  const old = fb.profile([ev('a', 'c', 'accepted', 400)], NOW).affinity('c');
  const recent = fb.profile([ev('a', 'c', 'accepted', 0)], NOW).affinity('c');
  assert.ok(old < recent, 'an old signal is weaker than a fresh one');
});

test('record / read round-trip + clear', () => {
  const fb = fresh();
  assert.deepStrictEqual(fb.read().events, []);
  fb.record({ skill: 'a', category: 'c', signal: 'accepted' });
  fb.record({ skill: 'b', signal: 'dismissed' });
  fb.record({ skill: 'z', signal: 'bogus' }); // invalid signal → ignored
  assert.strictEqual(fb.read().events.length, 2);
  fb.clear();
  assert.deepStrictEqual(fb.read().events, []);
});
