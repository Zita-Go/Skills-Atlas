import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EVENT_TYPES, clampStr, uaFamily, refHost, normalizeEvent } from '../lib.js';

test('clampStr truncates and rejects non-strings', () => {
  assert.equal(clampStr('abcdef', 3), 'abc');
  assert.equal(clampStr(123, 3), null);
  assert.equal(clampStr(undefined, 3), null);
});

test('uaFamily maps common agents, order-sensitive', () => {
  assert.equal(uaFamily('Mozilla/5.0 ... Edg/120'), 'Edge');
  assert.equal(uaFamily('Mozilla/5.0 ... Chrome/120 Safari/537'), 'Chrome');
  assert.equal(uaFamily('Mozilla/5.0 ... Version/17 Safari/605'), 'Safari');
  assert.equal(uaFamily('Mozilla/5.0 ... Firefox/121'), 'Firefox');
  assert.equal(uaFamily('weird'), 'other');
});

test('refHost returns host only, empty on garbage', () => {
  assert.equal(refHost('https://github.com/a/b?x=1'), 'github.com');
  assert.equal(refHost('not a url'), '');
  assert.equal(refHost(''), '');
});

test('normalizeEvent rejects unknown types', () => {
  assert.equal(normalizeEvent({ type: 'nope' }, { ts: 1 }), null);
});

test('normalizeEvent builds a clamped web row and merges derived fields', () => {
  const row = normalizeEvent(
    { type: 'search', target: 'x'.repeat(500), category: 'c', source: 's', lang: 'zh', view: 'cards', sid: 'abc', ver: 'v1', detail: 'y'.repeat(500), bogus: 'drop' },
    { ts: 42, ref: 'github.com', ua: 'Chrome', client: 'web' }
  );
  assert.equal(row.type, 'search');
  assert.equal(row.ts, 42);
  assert.equal(row.ref, 'github.com');
  assert.equal(row.ua, 'Chrome');
  assert.equal(row.target.length, 200);
  assert.equal(row.detail.length, 200);
  assert.equal(row.client, 'web');
  assert.equal(row.os, null);
  assert.equal(row.iid, null);
  assert.equal('bogus' in row, false);
});

test('normalizeEvent accepts CLI rows with client/os/iid', () => {
  const row = normalizeEvent(
    { type: 'cli_install', target: 'brainstorming', os: 'linux', iid: 'abcd1234', ver: '0.15.0' },
    { ts: 1, ref: '', ua: 'other', client: 'cli' }
  );
  assert.equal(row.type, 'cli_install');
  assert.equal(row.client, 'cli');
  assert.equal(row.os, 'linux');
  assert.equal(row.iid, 'abcd1234');
});

test('EVENT_TYPES has the 19 agreed types (11 web + 8 cli)', () => {
  assert.equal(EVENT_TYPES.size, 19);
  assert.ok(EVENT_TYPES.has('use_open') && EVENT_TYPES.has('err_js') && EVENT_TYPES.has('cli_install') && EVENT_TYPES.has('onboard') && EVENT_TYPES.has('skill_created'));
});
