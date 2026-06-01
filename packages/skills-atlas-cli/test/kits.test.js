'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { kitFor, buildKitPlan, allKitSkills, ARCHETYPE_NAMES } = require('../src/kits');
const { loadData } = require('../src/data');
const { buildIndices } = require('../src/index-build');

const { skillIndex } = buildIndices(loadData({ quiet: true }).data);

test('kitFor(generic) is the universal core only', () => {
  const names = kitFor(['generic']).map(s => s.name);
  assert.ok(names.includes('brainstorming') && names.includes('systematic-debugging'));
  assert.ok(!names.includes('frontend-design'), 'no archetype add-ons for generic');
});

test('kitFor(web-frontend) = core + frontend add-ons, deduped, with reasons', () => {
  const kit = kitFor(['web-frontend']);
  const names = kit.map(s => s.name);
  assert.ok(names.includes('writing-plans'), 'has core');
  assert.ok(names.includes('frontend-design'), 'has frontend add-on');
  assert.strictEqual(new Set(names).size, names.length, 'no duplicates');
  assert.ok(kit.every(s => s.reason && (s.group === 'core' || ARCHETYPE_NAMES.includes(s.group))));
});

test('multiple archetypes union their add-ons', () => {
  const names = kitFor(['web-frontend', 'data-ml']).map(s => s.name);
  assert.ok(names.includes('frontend-design') && names.includes('data-analysis'));
});

test('buildKitPlan marks already-installed skills', () => {
  const plan = buildKitPlan(['web-frontend'], new Set(['frontend-design']));
  const fe = plan.skills.find(s => s.name === 'frontend-design');
  assert.strictEqual(fe.installed, true);
  assert.deepStrictEqual(plan.archetypes, ['web-frontend']);
});

test('EVERY kit skill exists in the catalog (anti-rot)', () => {
  const missing = allKitSkills().filter(n => !skillIndex.has(n.toLowerCase()));
  assert.deepStrictEqual(missing, [], `kit references skills not in catalog: ${missing.join(', ')}`);
});
