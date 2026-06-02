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
const ev = (skill, signal, daysAgo = 0) => ({ skill, signal, at: new Date(NOW - daysAgo * 86400000).toISOString() });

test('profile: only an explicit dismiss suppresses; accept does not', () => {
  const fb = fresh();
  const p = fb.profile([ev('a', 'dismissed'), ev('b', 'accepted')]);
  assert.ok(p.isSuppressed('a'), 'dismiss suppressed');
  assert.ok(!p.isSuppressed('b'), 'accepted not suppressed');
  assert.deepStrictEqual([...p.suppressed], ['a']);
});

test('profile: the latest action wins', () => {
  const fb = fresh();
  assert.ok(!fb.profile([ev('x', 'dismissed', 2), ev('x', 'accepted', 0)]).isSuppressed('x'), 'a later install un-suppresses');
  assert.ok(fb.profile([ev('y', 'accepted', 2), ev('y', 'dismissed', 0)]).isSuppressed('y'), 'a later dismiss re-suppresses');
});

test('record / read round-trip + clear; invalid events ignored', () => {
  const fb = fresh();
  assert.deepStrictEqual(fb.read().events, []);
  fb.record({ skill: 'a', signal: 'dismissed' });
  fb.record({ skill: 'b', signal: 'accepted' });
  fb.record({ skill: 'r', signal: 'regret' });  // 'regret' is no longer a signal → ignored
  fb.record({ skill: 'z', signal: 'bogus' });   // not a known signal → ignored
  fb.record({ signal: 'dismissed' });           // no skill → ignored
  assert.strictEqual(fb.read().events.length, 2);
  fb.clear();
  assert.deepStrictEqual(fb.read().events, []);
});
