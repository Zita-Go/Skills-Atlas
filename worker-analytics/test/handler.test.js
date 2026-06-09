import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../index.js';

function mockEnv() {
  const calls = { batched: null };
  const env = {
    ALLOWED_ORIGINS: 'https://zita-go.github.io',
    DB: {
      prepare() { return { bind: (...a) => ({ a }) }; },
      async batch(stmts) { calls.batched = stmts; },
    },
  };
  return { env, calls };
}
function req(body, origin = 'https://zita-go.github.io') {
  return new Request('https://w/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': origin, 'Referer': 'https://github.com/x', 'User-Agent': 'Mozilla/5.0 Chrome/120 Safari/537', 'CF-Connecting-IP': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

test('valid batch inserts normalized rows, returns 204', async () => {
  const { env, calls } = mockEnv();
  const res = await worker.fetch(req({ events: [
    { type: 'use_open', target: 'brainstorming', sid: 's1', lang: 'zh', view: 'cards', ver: 'v1' },
    { type: 'bogus', target: 'x' },
  ] }), env);
  assert.equal(res.status, 204);
  assert.equal(calls.batched.length, 1);
  assert.equal(calls.batched[0].a[1], 'use_open');
  assert.equal(calls.batched[0].a[8], 'github.com');
  assert.equal(calls.batched[0].a[12], 'web');
});

test('CLI batch (no Origin) inserts with client=cli + iid/os', async () => {
  const { env, calls } = mockEnv();
  const r = new Request('https://w/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'node' },
    body: JSON.stringify({ client: 'cli', events: [{ type: 'cli_install', target: 'brainstorming', iid: 'abcd1234', os: 'linux', ver: '0.15.0' }] }),
  });
  const res = await worker.fetch(r, env);
  assert.equal(res.status, 204);
  assert.equal(calls.batched.length, 1);
  assert.equal(calls.batched[0].a[1], 'cli_install');
  assert.equal(calls.batched[0].a[12], 'cli');
  assert.equal(calls.batched[0].a[14], 'abcd1234');
});

test('disallowed origin → 204, no insert', async () => {
  const { env, calls } = mockEnv();
  const res = await worker.fetch(req({ events: [{ type: 'use_open' }] }, 'https://evil.com'), env);
  assert.equal(res.status, 204);
  assert.equal(calls.batched, null);
});

test('empty/garbage body → 204, no insert', async () => {
  const { env, calls } = mockEnv();
  const r = new Request('https://w/event', { method: 'POST', headers: { 'Origin': 'https://zita-go.github.io' }, body: 'not json' });
  const res = await worker.fetch(r, env);
  assert.equal(res.status, 204);
  assert.equal(calls.batched, null);
});

test('GET / health → 200 ok', async () => {
  const { env } = mockEnv();
  const res = await worker.fetch(new Request('https://w/'), env);
  assert.equal(res.status, 200);
});
