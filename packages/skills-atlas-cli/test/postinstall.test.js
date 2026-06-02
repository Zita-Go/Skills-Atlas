'use strict';
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const script = path.join(__dirname, '..', 'src', 'postinstall.js');
// CI is forced empty so the global-install case isn't suppressed when the suite runs in CI.
const run = env => execFileSync(process.execPath, [script], { env: { ...process.env, CI: '', ...env }, encoding: 'utf8' });

test('postinstall: prints a getting-started note on a global (-g) install', () => {
  const out = run({ npm_config_global: 'true' });
  assert.match(out, /Skills Atlas[\s\S]*installed/);
  assert.match(out, /skills-atlas search/);
});

test('postinstall: stays silent on a local / dev install (not -g)', () => {
  assert.strictEqual(run({ npm_config_global: '' }).trim(), '');
});

test('postinstall: stays silent in CI even on a global install', () => {
  assert.strictEqual(execFileSync(process.execPath, [script], { env: { ...process.env, npm_config_global: 'true', CI: 'true' }, encoding: 'utf8' }).trim(), '');
});

test('postinstall: exits 0 (never breaks an install)', () => {
  // execFileSync throws if the process exits non-zero; reaching here means it exited 0.
  run({ npm_config_global: 'true' });
  run({ npm_config_global: '' });
});
