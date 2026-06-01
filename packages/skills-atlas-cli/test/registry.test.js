'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function isolate() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-reg-'));
  process.env.XDG_CONFIG_HOME = path.join(home, 'config');
  process.env.XDG_CACHE_HOME = path.join(home, 'cache');
  delete process.env.SKILLS_ATLAS_SOURCES;
  delete require.cache[require.resolve('../src/registry')];
  return require('../src/registry');
}

test('config add/list/remove round-trips and upserts', () => {
  const r = isolate();
  assert.deepStrictEqual(r.listSources(), []);
  r.addSource('https://x/data.json', { name: 'x' });
  r.addSource('https://x/data.json'); // upsert, no dup
  assert.strictEqual(r.listSources().length, 1);
  assert.strictEqual(r.listSources()[0].name, 'x');
  assert.strictEqual(r.removeSource('https://x/data.json'), true);
  assert.deepStrictEqual(r.listSources(), []);
});

test('effectiveSources merges config + env, de-duped, config first', () => {
  const r = isolate();
  r.addSource('https://a/data.json');
  process.env.SKILLS_ATLAS_SOURCES = 'https://a/data.json, https://b/data.json';
  const urls = r.effectiveSources().map(s => s.url);
  assert.deepStrictEqual(urls, ['https://a/data.json', 'https://b/data.json']);
  delete process.env.SKILLS_ATLAS_SOURCES;
});

test('source cache write/read/remove', () => {
  const r = isolate();
  const url = 'https://a/data.json';
  assert.strictEqual(r.readCachedSource(url), null);
  r.cacheSource(url, { sections: [], vendors: {} });
  assert.deepStrictEqual(r.readCachedSource(url), { sections: [], vendors: {} });
  r.removeCachedSource(url);
  assert.strictEqual(r.readCachedSource(url), null);
});

test('malformed config.json → treated as empty', () => {
  const r = isolate();
  fs.mkdirSync(path.dirname(r.configFile()), { recursive: true });
  fs.writeFileSync(r.configFile(), '{ not json');
  assert.deepStrictEqual(r.listSources(), []);
});

test('autopilot toggles default on and persist, preserving sources', () => {
  const r = isolate();
  assert.deepStrictEqual(r.getAutopilot(), { suggest: true, gapAlerts: true, prune: false });
  r.addSource('https://a/data.json');
  r.setAutopilot({ suggest: false });
  assert.deepStrictEqual(r.getAutopilot(), { suggest: false, gapAlerts: true, prune: false });
  assert.strictEqual(r.listSources().length, 1, 'sources preserved');
});
