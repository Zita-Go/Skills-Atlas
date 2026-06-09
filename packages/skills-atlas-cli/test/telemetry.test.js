'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

function freshEnv() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-tel-'));
  const env = { XDG_CONFIG_HOME: path.join(dir, 'cfg'), XDG_CACHE_HOME: path.join(dir, 'cache') };
  return { dir, env };
}
function load() { delete require.cache[require.resolve('../src/telemetry')]; return require('../src/telemetry'); }

test('inert when no endpoint configured', () => {
  const { env } = freshEnv();
  Object.assign(process.env, env); delete process.env.SKILLS_ATLAS_TELEMETRY_ENDPOINT; delete process.env.DO_NOT_TRACK;
  const t = load();
  assert.equal(t.isEnabled(), false);
});

test('on by default once endpoint set; first run writes iid + is stable', () => {
  const { env } = freshEnv();
  Object.assign(process.env, env, { SKILLS_ATLAS_TELEMETRY_ENDPOINT: 'https://test.invalid/event' });
  delete process.env.DO_NOT_TRACK;
  const t = load();
  const s1 = t.state();
  assert.equal(s1.enabled, true);
  assert.match(s1.iid, /^[0-9a-f]{16}$/);
  const s2 = t.state();
  assert.equal(s2.iid, s1.iid);
});

test('DO_NOT_TRACK disables regardless of endpoint', () => {
  const { env } = freshEnv();
  Object.assign(process.env, env, { SKILLS_ATLAS_TELEMETRY_ENDPOINT: 'https://test.invalid/event', DO_NOT_TRACK: '1' });
  const t = load();
  assert.equal(t.isEnabled(), false);
});

test('setEnabled(false) sticks', () => {
  const { env } = freshEnv();
  Object.assign(process.env, env, { SKILLS_ATLAS_TELEMETRY_ENDPOINT: 'https://test.invalid/event' });
  delete process.env.DO_NOT_TRACK;
  const t = load();
  t.setEnabled(false);
  assert.equal(t.isEnabled(), false);
  t.setEnabled(true);
  assert.equal(t.isEnabled(), true);
});

test('emit is a no-op when disabled (no outbox written)', () => {
  const { env } = freshEnv();
  Object.assign(process.env, env, { DO_NOT_TRACK: '1', SKILLS_ATLAS_TELEMETRY_ENDPOINT: 'https://test.invalid/event' });
  const t = load();
  t.emit('cli_cmd', { target: 'search' });
  t._flushNow({ spawn: false });
  const outbox = path.join(env.XDG_CACHE_HOME, 'skills-atlas', 'telemetry-outbox');
  const n = fs.existsSync(outbox) ? fs.readdirSync(outbox).length : 0;
  assert.equal(n, 0);
});

test('enabled emit + flush writes one outbox batch with iid/ver/os/client', () => {
  const { env } = freshEnv();
  Object.assign(process.env, env, { SKILLS_ATLAS_TELEMETRY_ENDPOINT: 'https://test.invalid/event' });
  delete process.env.DO_NOT_TRACK;
  const t = load();
  t.emit('cli_install', { target: 'brainstorming', detail: 'ok' });
  t._flushNow({ spawn: false });
  const outbox = path.join(env.XDG_CACHE_HOME, 'skills-atlas', 'telemetry-outbox');
  const files = fs.readdirSync(outbox);
  assert.equal(files.length, 1);
  const payload = JSON.parse(fs.readFileSync(path.join(outbox, files[0]), 'utf8'));
  assert.equal(payload.client, 'cli');
  assert.equal(payload.events[0].type, 'cli_install');
  assert.match(payload.events[0].iid, /^[0-9a-f]{16}$/);
  assert.ok(payload.events[0].ver && payload.events[0].os);
});

test('apstate records + expires suggestions', () => {
  const { env } = freshEnv(); Object.assign(process.env, env);
  delete require.cache[require.resolve('../src/apstate')];
  const a = require('../src/apstate');
  a.recordSuggested(['brainstorming']);
  assert.equal(a.wasRecentlySuggested('brainstorming'), true);
  assert.equal(a.wasRecentlySuggested('nope'), false);
});
