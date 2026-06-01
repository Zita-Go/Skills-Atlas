'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

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
