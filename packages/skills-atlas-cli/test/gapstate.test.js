'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function fresh() {
  process.env.XDG_CACHE_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-gst-'));
  delete require.cache[require.resolve('../src/gapstate')];
  return require('../src/gapstate');
}

test('dismiss / isDismissed / clear round-trip', () => {
  const g = fresh();
  assert.deepStrictEqual(g.read().dismissed, []);
  g.dismiss('systematic-debugging');
  g.dismiss('systematic-debugging'); // no dup
  assert.ok(g.isDismissed('systematic-debugging'));
  assert.strictEqual(g.read().dismissed.length, 1);
  g.clear();
  assert.deepStrictEqual(g.read().dismissed, []);
});

test('malformed file → empty defaults', () => {
  const g = fresh();
  fs.mkdirSync(path.dirname(g.file()), { recursive: true });
  fs.writeFileSync(g.file(), '{ not json');
  assert.deepStrictEqual(g.read().dismissed, []);
});

test('activitySignature: dominant tokens, deterministic', () => {
  const g = fresh();
  const recent = [{ text: 'debug the crash' }, { text: 'debug this heisenbug crash' }];
  const a = g.activitySignature(recent);
  assert.ok(a.includes('debug') && a.includes('crash'), 'captures the recurring tokens');
  assert.deepStrictEqual(a, g.activitySignature(recent), 'same input → same signature');
});

test('signatureShifted: same → false, disjoint → true, no prior → true', () => {
  const g = fresh();
  assert.strictEqual(g.signatureShifted(['a', 'b', 'c'], ['a', 'b', 'c']), false);
  assert.strictEqual(g.signatureShifted(['x', 'y', 'z'], ['a', 'b', 'c']), true);
  assert.strictEqual(g.signatureShifted(['a', 'b'], []), true);
  assert.strictEqual(g.signatureShifted(['a', 'b'], null), true);
});

test('shouldNudge: floor blocks, shift refires, persistence falls back', () => {
  const g = fresh();
  const H = 3600000;
  const recent = [{ text: 'refactor the payment module' }, { text: 'refactor payment code' }];
  const sig = g.activitySignature(recent);

  // inside the ~90-min anti-spam floor → never fire
  assert.strictEqual(g.shouldNudge({ lastNudge: 0, lastSig: [] }, recent, 60 * 60000).fire, false);
  // past the floor, activity shifted from an unrelated prior → fire
  assert.strictEqual(g.shouldNudge({ lastNudge: 0, lastSig: ['unrelated', 'topic'] }, recent, 2 * H).fire, true);
  // past the floor but SAME activity, before the 12h fallback → stay quiet
  assert.strictEqual(g.shouldNudge({ lastNudge: 0, lastSig: sig }, recent, 3 * H).fire, false);
  // same activity but past the 12h fallback → resurface
  assert.strictEqual(g.shouldNudge({ lastNudge: 0, lastSig: sig }, recent, 13 * H).fire, true);
});
