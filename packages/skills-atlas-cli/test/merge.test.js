'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { mergeCatalogs } = require('../src/merge');

const base = {
  sections: [{ title: 'Pub', subsections: [{ rows: [{ skills: ['shared'], sources: [{ name: 'pubv' }] }] }] }],
  vendors: { pubv: { author: 'pub', repo: 'r', stars: 100 } },
};
const priv = {
  sections: [{ title: 'Internal', subsections: [{ rows: [
    { skills: ['shared'], sources: [{ name: 'privv' }] },
    { skills: ['internal-only'], sources: [{ name: 'privv' }] },
  ] }] }],
  vendors: { privv: { author: 'org', repo: 'internal', stars: 0 } },
};

test('mergeCatalogs appends sections and merges vendors (private tagged)', () => {
  const m = mergeCatalogs(base, [priv]);
  assert.strictEqual(m.sections.length, 2);
  assert.ok(m.vendors.pubv && m.vendors.privv);
  assert.strictEqual(m.vendors.privv._private, true);
  assert.ok(!m.vendors.pubv._private);
});

test('mergeCatalogs does not mutate inputs', () => {
  mergeCatalogs(base, [priv]);
  assert.ok(!base.vendors.pubv._private && !priv.vendors.privv._private);
});

test('no overlays → base-equivalent', () => {
  const m = mergeCatalogs(base, []);
  assert.strictEqual(m.sections.length, 1);
});

module.exports = { base, priv }; // reused by the vendorsFor test (Task 4)
