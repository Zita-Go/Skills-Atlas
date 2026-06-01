'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function isolate() {
  process.env.XDG_CACHE_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-gaps-'));
  delete process.env.SKILLS_ATLAS_GAP_THRESHOLD;
  delete process.env.SKILLS_ATLAS_GAP_WINDOW_DAYS;
  delete require.cache[require.resolve('../src/gaps')];
  return require('../src/gaps');
}
const DAY = 86400000;

test('recordEvent tallies events + per-skill counts', () => {
  const g = isolate();
  const s = g.readStore();
  g.recordEvent(s, { group: 'debugging', skill: 'systematic-debugging', now: 1000 });
  g.recordEvent(s, { group: 'debugging', skill: 'systematic-debugging', now: 2000 });
  g.recordEvent(s, { group: 'debugging', skill: 'code-debugging', now: 3000 });
  assert.strictEqual(s.groups.debugging.events.length, 3);
  assert.strictEqual(s.groups.debugging.skills['systematic-debugging'], 2);
});

test('computeGaps surfaces a group at threshold, recommends the top uninstalled skill', () => {
  const g = isolate();
  const now = 10 * DAY;
  const s = g.readStore();
  for (let i = 0; i < 5; i++) g.recordEvent(s, { group: 'debugging', skill: 'systematic-debugging', now: now - i * DAY });
  g.recordEvent(s, { group: 'debugging', skill: 'code-debugging', now });
  const gaps = g.computeGaps(s, { now, threshold: 5, installed: new Set() });
  assert.strictEqual(gaps.length, 1);
  assert.strictEqual(gaps[0].group, 'debugging');
  assert.strictEqual(gaps[0].recommended, 'systematic-debugging');
  assert.strictEqual(gaps[0].count, 6);
});

test('below threshold → no gap; noise of distinct groups → no gap', () => {
  const g = isolate();
  const now = 5 * DAY;
  const s = g.readStore();
  for (let i = 0; i < 4; i++) g.recordEvent(s, { group: 'debugging', skill: 'systematic-debugging', now: now - i * DAY });
  for (const grp of ['a', 'b', 'c']) g.recordEvent(s, { group: grp, skill: 'x', now });
  assert.deepStrictEqual(g.computeGaps(s, { now, threshold: 5, installed: new Set() }), []);
});

test('installed skill suppresses the gap (covered)', () => {
  const g = isolate();
  const now = 5 * DAY;
  const s = g.readStore();
  for (let i = 0; i < 6; i++) g.recordEvent(s, { group: 'debugging', skill: 'systematic-debugging', now: now - i * (DAY / 2) });
  assert.deepStrictEqual(g.computeGaps(s, { now, threshold: 5, installed: new Set(['systematic-debugging']) }), []);
});

test('dismiss suppresses; pruneOld drops stale events outside the window', () => {
  const g = isolate();
  const now = 100 * DAY;
  const s = g.readStore();
  for (let i = 0; i < 6; i++) g.recordEvent(s, { group: 'debugging', skill: 'sd', now: now - i * DAY });
  g.recordEvent(s, { group: 'debugging', skill: 'sd', now: now - 90 * DAY }); // stale
  g.pruneOld(s, now, 30 * DAY);
  assert.strictEqual(s.groups.debugging.events.length, 6, 'stale event pruned');
  g.dismiss(s, 'debugging', now);
  assert.deepStrictEqual(g.computeGaps(s, { now, threshold: 5, installed: new Set() }), []);
});

test('env overrides threshold', () => {
  const g = isolate();
  process.env.SKILLS_ATLAS_GAP_THRESHOLD = '2';
  const now = 5 * DAY, s = g.readStore();
  g.recordEvent(s, { group: 'd', skill: 'x', now });
  g.recordEvent(s, { group: 'd', skill: 'x', now });
  assert.strictEqual(g.computeGaps(s, { now, installed: new Set() }).length, 1);
  delete process.env.SKILLS_ATLAS_GAP_THRESHOLD;
});
