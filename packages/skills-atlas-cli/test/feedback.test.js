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
const A = '/tmp/project-A';
const B = '/tmp/project-B';

test('dismiss is global: suppressed in every project', () => {
  const fb = fresh();
  fb.dismiss('x');
  assert.ok(fb.globalDismissed().has('x'));
  assert.ok(fb.current(A).isSuppressed('x'), 'suppressed in A');
  assert.ok(fb.current(B).isSuppressed('x'), 'suppressed in B too');
});

test('removal is project-scoped: suppressed here, not elsewhere', () => {
  const fb = fresh();
  fb.removedInProject('y', A);
  assert.ok(fb.projectRemoved(A).has('y'));
  assert.ok(!fb.projectRemoved(B).has('y'), 'not recorded for B');
  assert.ok(fb.current(A).isSuppressed('y'), 'suppressed in A');
  assert.ok(!fb.current(B).isSuppressed('y'), 'NOT suppressed in B — may be useful there');
});

test('installing clears both the global dismiss and this project\'s removal', () => {
  const fb = fresh();
  fb.dismiss('x');
  fb.removedInProject('x', A);
  assert.ok(fb.current(A).isSuppressed('x'));
  fb.installed('x', A);
  assert.ok(!fb.current(A).isSuppressed('x'), 'cleared in A (latest action wins)');
  assert.ok(!fb.globalDismissed().has('x'), 'global dismiss cleared too');
});

test('current() merges global + this-project, with a breakdown', () => {
  const fb = fresh();
  fb.dismiss('g');
  fb.removedInProject('p', A);
  const cur = fb.current(A);
  assert.deepStrictEqual([...cur.global], ['g']);
  assert.deepStrictEqual([...cur.project], ['p']);
  assert.deepStrictEqual([...cur.suppressed].sort(), ['g', 'p']);
});

test('clear() empties global + current project', () => {
  const fb = fresh();
  fb.dismiss('g');
  fb.removedInProject('p', process.cwd());
  fb.clear();
  assert.strictEqual(fb.globalDismissed().size, 0);
  assert.strictEqual(fb.projectRemoved(process.cwd()).size, 0);
});
