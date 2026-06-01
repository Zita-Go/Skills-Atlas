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
