'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const km = require('../src/kitmanifest');

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'sa-kit-')); }

test('write then read round-trips', () => {
  const dir = tmp();
  const m = { version: 1, archetypes: ['web-frontend'], scope: 'project',
    skills: [{ name: 'frontend-design', source: 'obra', ref: 'main', hash: 'abc123' }] };
  km.write(dir, m);
  assert.deepStrictEqual(km.read(dir), m);
  assert.ok(fs.readFileSync(km.fileFor(dir), 'utf8').endsWith('\n'), 'trailing newline');
});

test('read of a missing/corrupt file returns null', () => {
  const dir = tmp();
  assert.strictEqual(km.read(dir), null);
  fs.writeFileSync(km.fileFor(dir), '{ not json');
  assert.strictEqual(km.read(dir), null);
});

test('planSync classifies install / up-to-date / local-changes', () => {
  const manifest = { skills: [
    { name: 'a', hash: 'h1' }, { name: 'b', hash: 'h2' }, { name: 'c', hash: 'h3' },
  ] };
  // a not installed; b matches; c drifted
  const installed = { a: null, b: 'h2', c: 'hX' }; // name -> on-disk hash (null = absent)
  const actions = km.planSync(manifest, name => installed[name]);
  assert.deepStrictEqual(actions.find(x => x.name === 'a').action, 'install');
  assert.deepStrictEqual(actions.find(x => x.name === 'b').action, 'up-to-date');
  assert.deepStrictEqual(actions.find(x => x.name === 'c').action, 'local-changes');
});
