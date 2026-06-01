'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { isValid } = require('../src/data');

test('isValid: structural — rejects old/partial schema, accepts a minimal valid catalog', () => {
  assert.ok(isValid({ sections: [], vendors: {} }), 'empty-but-shaped is valid');
  assert.ok(isValid({ sections: [{ subsections: [{ rows: [] }] }], vendors: {} }));
  assert.strictEqual(isValid({ sections: [{ subgroups: [] }], vendors: {} }), false, 'old `subgroups` schema rejected');
  assert.strictEqual(isValid({ sections: [{ subsections: [{}] }], vendors: {} }), false, 'subsection missing `rows` rejected');
  assert.strictEqual(isValid({ sections: [{}], vendors: {} }), false, 'section missing `subsections` rejected');
  assert.strictEqual(isValid({ sections: [] }), false, 'missing vendors rejected');
  assert.strictEqual(isValid(null), false);
});

test('loadData drops a cached source with a broken schema (no cascade crash)', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-data-'));
  const saved = { c: process.env.XDG_CONFIG_HOME, k: process.env.XDG_CACHE_HOME, s: process.env.SKILLS_ATLAS_SOURCES };
  process.env.XDG_CONFIG_HOME = path.join(home, 'config');
  process.env.XDG_CACHE_HOME = path.join(home, 'cache');
  delete process.env.SKILLS_ATLAS_SOURCES;
  for (const m of ['../src/registry', '../src/data', '../src/merge']) delete require.cache[require.resolve(m)];
  try {
    const registry = require('../src/registry');
    const { loadData } = require('../src/data');
    // old-schema source: has sections+vendors but sections[].subsections is missing
    const bad = { sections: [{ title: 'X', subgroups: [{ groups: [] }] }], vendors: { acme: {} } };
    const url = 'file:///bad/source.json';
    registry.addSource(url);
    registry.cacheSource(url, bad);
    let data;
    assert.doesNotThrow(() => { data = loadData({ quiet: true }).data; }, 'a broken cached source must not crash loadData');
    assert.ok(data.sections.length >= 1, 'falls back to the valid base catalog');
  } finally {
    process.env.XDG_CONFIG_HOME = saved.c; process.env.XDG_CACHE_HOME = saved.k;
    if (saved.s === undefined) delete process.env.SKILLS_ATLAS_SOURCES; else process.env.SKILLS_ATLAS_SOURCES = saved.s;
    for (const m of ['../src/registry', '../src/data', '../src/merge']) delete require.cache[require.resolve(m)];
  }
});

test('loadData merges a cached private source (local) offline', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-data-'));
  const saved = { c: process.env.XDG_CONFIG_HOME, k: process.env.XDG_CACHE_HOME, s: process.env.SKILLS_ATLAS_SOURCES };
  process.env.XDG_CONFIG_HOME = path.join(home, 'config');
  process.env.XDG_CACHE_HOME = path.join(home, 'cache');
  delete process.env.SKILLS_ATLAS_SOURCES;
  for (const m of ['../src/registry', '../src/data', '../src/merge']) delete require.cache[require.resolve(m)];
  try {
    const registry = require('../src/registry');
    const { loadData } = require('../src/data');
    const { buildIndices } = require('../src/index-build');
    const priv = { sections: [{ title: 'Internal', title_en: 'Internal',
      subsections: [{ title: 'x', rows: [{ skills: ['acme-internal-skill'], group: 'Acme', sources: [{ name: 'acme' }] }] }] }],
      vendors: { acme: { author: 'acme', repo: 'skills' } } };
    const url = 'file:///does/not/matter.json';
    registry.addSource(url);
    registry.cacheSource(url, priv);

    const { data } = loadData({ quiet: true });
    const { skillIndex } = buildIndices(data);
    assert.ok(skillIndex.has('acme-internal-skill'), 'internal skill visible after merge');
    assert.ok(data.sections.length >= 2, 'public base still present');
  } finally {
    process.env.XDG_CONFIG_HOME = saved.c; process.env.XDG_CACHE_HOME = saved.k;
    if (saved.s === undefined) delete process.env.SKILLS_ATLAS_SOURCES; else process.env.SKILLS_ATLAS_SOURCES = saved.s;
    for (const m of ['../src/registry', '../src/data', '../src/merge']) delete require.cache[require.resolve(m)];
  }
});
