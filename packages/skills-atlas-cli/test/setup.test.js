'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function isolate() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-setup-'));
  process.env.XDG_CACHE_HOME = path.join(dir, 'cache');
  process.env.XDG_CONFIG_HOME = path.join(dir, 'cfg');
  delete require.cache[require.resolve('../src/commands/setup')];
  return require('../src/commands/setup');
}
function capture(fn) {
  const log = console.log; let out = '';
  console.log = (...a) => { out += a.join(' ') + '\n'; };
  return Promise.resolve(fn()).then(v => { console.log = log; return out; }, e => { console.log = log; throw e; });
}

test('setup --session-start: welcomes once, then stays silent', async () => {
  const setup = isolate();
  const first = await capture(() => setup(['--session-start']));
  assert.ok(first.includes('SessionStart') && /first run/i.test(first), 'emits the one-time welcome JSON');
  const second = await capture(() => setup(['--session-start']));
  assert.strictEqual(second.trim(), '', 'silent on the second session');
});

test('setup --reset re-arms the welcome', async () => {
  const setup = isolate();
  await capture(() => setup(['--session-start']));
  assert.strictEqual((await capture(() => setup(['--session-start']))).trim(), '', 'silent after first welcome');
  await capture(() => setup(['--reset']));
  assert.ok((await capture(() => setup(['--session-start']))).includes('SessionStart'), 'welcomes again after reset');
});

test('setup (manual): prints status + commands, and counts as onboarded', async () => {
  const setup = isolate();
  const out = await capture(() => setup([]));
  assert.ok(/installed and ready/i.test(out) && /skill-craft/.test(out), 'shows status + what-you-can-do');
  assert.strictEqual((await capture(() => setup(['--session-start']))).trim(), '', 'a manual run suppresses the auto welcome');
});

test('setup --json: shape', async () => {
  const setup = isolate();
  const j = JSON.parse(await capture(() => setup(['--json'])));
  assert.strictEqual(j.installed, true);
  assert.strictEqual(typeof j.autopilot, 'boolean');
});
