'use strict';
const test = require('node:test');
const assert = require('node:assert');
const cp = require('../src/craft-prompts');

test('detectionPrompt: fills every slot, no leftovers, NONE-biased, Gate-4 fed', () => {
  const p = cp.detectionPrompt({
    activity: '  - a', candidates: '- x: y', dismissed: 'dx',
    installed: 'alpha, beta', claudeMd: 'always use make build', lang: 'English',
  });
  assert.ok(!/{{\w+}}/.test(p), 'no leftover placeholders');
  assert.ok(p.includes('alpha, beta'), 'installed threaded (Gate 4)');
  assert.ok(p.includes('always use make build'), 'CLAUDE.md threaded (Gate 4)');
  assert.ok(/default answer is NONE/.test(p), 'biased hard toward NONE');
  assert.ok(/QUOTE|quotable|QUOTABLE/.test(p), 'the user-specific-delta firewall is present');
  assert.ok(/CRAFT:/.test(p) && /EXISTING/.test(p), 'three-way verdict format present');
});

test('craftPrompt: fills pattern + evidence, $ stays literal, backticks intact', () => {
  const p = cp.craftPrompt({ pattern: 'do $X | DELTA: $& foo', evidence: '  - one\n  - two' });
  assert.ok(!/{{\w+}}/.test(p), 'no leftover placeholders');
  assert.ok(p.includes('do $X | DELTA: $& foo'), '$ preserved literally (split/join, not regex)');
  assert.ok(p.includes('  - one\n  - two'), 'evidence injected');
  assert.ok(p.includes('`skills-atlas craft`') && p.includes('`make openapi`'), 'inner backticks intact');
  assert.ok(/firewall against correct-but-useless/.test(p), 'anti-fluff firewall present');
});
