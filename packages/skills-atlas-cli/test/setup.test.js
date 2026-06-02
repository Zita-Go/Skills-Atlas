'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

function isolate() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-setup-'));
  process.env.XDG_CACHE_HOME = path.join(dir, 'cache');
  process.env.XDG_CONFIG_HOME = path.join(dir, 'cfg');
  delete require.cache[require.resolve('../src/commands/setup')];
  return { setup: require('../src/commands/setup'), dir };
}
function capture(fn) {
  const log = console.log; let out = '';
  console.log = (...a) => { out += a.join(' ') + '\n'; };
  return Promise.resolve(fn()).then(v => { console.log = log; return out; }, e => { console.log = log; throw e; });
}
const markerPath = (dir, name) => path.join(dir, 'cache', 'skills-atlas', name);

test('setup --session-start: fresh welcome (verbatim systemMessage) once, then silent', async () => {
  const { setup } = isolate();
  const first = await capture(() => setup(['--session-start']));
  const j = JSON.parse(first);
  assert.ok(j.systemMessage && /Skills Atlas is on/.test(j.systemMessage), 'fresh-install welcome via systemMessage');
  assert.ok(!j.hookSpecificOutput.additionalContext, 'NOT additionalContext (so it is not paraphrased)');
  assert.ok(/lang en\|zh/.test(j.systemMessage), 'surfaces the language setting');
  assert.strictEqual((await capture(() => setup(['--session-start']))).trim(), '', 'silent on the second session');
});

test('setup --session-start: "Nicely done" variant after the install prompt was shown', async () => {
  const { setup, dir } = isolate();
  fs.mkdirSync(path.dirname(markerPath(dir, 'install-prompt-shown')), { recursive: true });
  fs.writeFileSync(markerPath(dir, 'install-prompt-shown'), 'x');
  const j = JSON.parse(await capture(() => setup(['--session-start'])));
  assert.ok(/Nicely done/.test(j.systemMessage), 'congrats variant when they just installed the engine');
});

test('setup --reset re-arms the welcome (clears both markers)', async () => {
  const { setup } = isolate();
  await capture(() => setup(['--session-start']));
  assert.strictEqual((await capture(() => setup(['--session-start']))).trim(), '', 'silent after first welcome');
  await capture(() => setup(['--reset']));
  assert.ok(JSON.parse(await capture(() => setup(['--session-start']))).systemMessage, 'welcomes again after reset');
});

test('setup (manual): status + what-you-can-do + Settings', async () => {
  const { setup } = isolate();
  const out = await capture(() => setup([]));
  assert.ok(/installed and ready/i.test(out) && /skill-craft/.test(out), 'status + commands');
  assert.ok(/Settings/.test(out) && /lang en\|zh/.test(out), 'shows the settings');
  assert.strictEqual((await capture(() => setup(['--session-start']))).trim(), '', 'a manual run suppresses the auto welcome');
});

const welcomeJs = path.join(__dirname, '..', 'plugin', 'skills-atlas', 'hooks', 'welcome.js');

test('welcome.js: engine-not-installed nudge on startup + remembers it when the CLI is missing', () => {
  const cache = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-wc-'));
  const noPath = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-nopath-'));
  const out = execFileSync(process.execPath, [welcomeJs], { input: '{"source":"startup"}', env: { ...process.env, PATH: noPath, XDG_CACHE_HOME: cache }, encoding: 'utf8' });
  const j = JSON.parse(out);
  assert.ok(/Almost there/.test(j.systemMessage), 'engine-not-installed nudge');
  assert.ok(fs.existsSync(path.join(cache, 'skills-atlas', 'install-prompt-shown')), 'remembers it was shown (→ next welcome says Nicely done)');
});

test('welcome.js: stays silent on resume/compact (never burns the one-shot mid-work)', () => {
  for (const source of ['resume', 'compact']) {
    const cache = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-wc-'));
    const noPath = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-nopath-'));
    const out = execFileSync(process.execPath, [welcomeJs], { input: JSON.stringify({ source }), env: { ...process.env, PATH: noPath, XDG_CACHE_HOME: cache }, encoding: 'utf8' });
    assert.strictEqual(out.trim(), '', `no output on ${source}`);
    assert.ok(!fs.existsSync(path.join(cache, 'skills-atlas', 'install-prompt-shown')), `no marker written on ${source}`);
  }
});

test('buildWelcome: returns the welcome once (consume marks onboarded), then null', () => {
  const { setup } = isolate();
  const ap = { replyLang: 'en', enabled: true };
  const first = setup.buildWelcome(ap, { consume: true });
  assert.ok(first && /Skills Atlas is on/.test(first) && /language/.test(first), 'welcome text the first time');
  assert.strictEqual(setup.buildWelcome(ap, { consume: true }), null, 'null once the one-shot is consumed');
});

test('suggest (UserPromptSubmit): first-run welcome fallback fires once — even on a SHORT prompt — then not again', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-sg-'));
  const env = { ...process.env, XDG_CACHE_HOME: path.join(dir, 'c'), XDG_CONFIG_HOME: path.join(dir, 'cfg') };
  delete env.SKILLS_ATLAS_SUBCALL;
  const bin = path.join(__dirname, '..', 'bin', 'skills.js');
  // A short prompt (< 8 chars) that the suggestion min-length gate would drop — the welcome
  // must still fire (regression: the fallback used to sit behind that gate).
  const event = JSON.stringify({ prompt: 'hi', session_id: 'fallback-test' });
  const sysMsg = out => (out.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).find(j => j && j.systemMessage) || {}).systemMessage || '';

  const out1 = execFileSync(process.execPath, [bin, 'suggest'], { input: event, env, encoding: 'utf8' });
  assert.ok(/Skills Atlas is on/.test(sysMsg(out1)), 'welcome on the very first prompt, even though it is short');
  assert.ok(fs.existsSync(path.join(dir, 'c', 'skills-atlas', 'onboarded')), 'marked onboarded after the fallback');

  const out2 = execFileSync(process.execPath, [bin, 'suggest'], { input: event, env, encoding: 'utf8' });
  assert.ok(!/Skills Atlas is on/.test(out2), 'no repeat welcome on the next prompt');
});
