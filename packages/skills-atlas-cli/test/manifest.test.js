'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const manifest = require('../src/manifest');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'sa-man-')); }

test('manifest record / list / upsert / remove round-trip', () => {
  const root = tmp();
  assert.deepStrictEqual(manifest.list(root), []);

  manifest.record(root, { skill: 'brainstorming', source: 'superpowers', repo: 'superpowers', branch: 'main', group: 'Core dev', files: 8, scripts: 4, installedAt: '2026-05-31T00:00:00Z' });
  manifest.record(root, { skill: 'writing-plans', source: 'superpowers', repo: 'superpowers', branch: 'main', files: 1, scripts: 0, installedAt: '2026-05-31T00:00:00Z' });

  let l = manifest.list(root);
  assert.strictEqual(l.length, 2);
  const b = l.find(x => x.skill === 'brainstorming');
  assert.strictEqual(b.source, 'superpowers');
  assert.strictEqual(b.files, 8);
  assert.strictEqual(b.scripts, 4);

  // upsert overwrites the same skill
  manifest.record(root, { skill: 'brainstorming', source: 'superpowers', repo: 'superpowers', branch: 'main', files: 9, installedAt: '2026-06-01T00:00:00Z' });
  assert.strictEqual(manifest.list(root).find(x => x.skill === 'brainstorming').files, 9);

  assert.strictEqual(manifest.remove(root, 'brainstorming'), true);
  assert.strictEqual(manifest.remove(root, 'nope'), false);
  assert.strictEqual(manifest.list(root).length, 1);

  assert.ok(fs.existsSync(manifest.fileFor(root)), 'manifest dotfile written');
  fs.rmSync(root, { recursive: true, force: true });
});

test('manifest is resilient to a corrupt file', () => {
  const root = tmp();
  fs.writeFileSync(manifest.fileFor(root), 'not json {{{');
  assert.deepStrictEqual(manifest.list(root), []);
  // a record after corruption still works (overwrites)
  manifest.record(root, { skill: 'x', source: 's', installedAt: 'now' });
  assert.strictEqual(manifest.list(root).length, 1);
  fs.rmSync(root, { recursive: true, force: true });
});
