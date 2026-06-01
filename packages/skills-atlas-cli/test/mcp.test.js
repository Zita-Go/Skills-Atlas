'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { handle } = require('../src/mcp');
const { loadData } = require('../src/data');
const { data } = loadData({ quiet: true });
const call = (method, params, id = 1) => handle({ jsonrpc: '2.0', id, method, params }, { data });

test('initialize returns protocol + serverInfo', async () => {
  const r = await call('initialize', { protocolVersion: '2025-06-18' });
  assert.strictEqual(r.result.serverInfo.name, 'skills-atlas');
  assert.strictEqual(r.result.protocolVersion, '2025-06-18');
  assert.ok(r.result.capabilities.tools);
});

test('notifications/initialized → no response (null)', async () => {
  const r = await handle({ jsonrpc: '2.0', method: 'notifications/initialized' }, { data });
  assert.strictEqual(r, null);
});

test('tools/list returns the 4 tools with object schemas', async () => {
  const r = await call('tools/list');
  const names = r.result.tools.map(t => t.name).sort();
  assert.deepStrictEqual(names, ['install_skill', 'list_categories', 'search_skills', 'skill_info']);
  assert.ok(r.result.tools.every(t => t.inputSchema && t.inputSchema.type === 'object'));
});

test('search_skills → matching text', async () => {
  const r = await call('tools/call', { name: 'search_skills', arguments: { query: 'translate book' } });
  assert.strictEqual(r.result.isError, false);
  assert.match(r.result.content[0].text, /translate-book/);
});

test('skill_info → guidance text', async () => {
  const r = await call('tools/call', { name: 'skill_info', arguments: { skill: 'brainstorming' } });
  assert.strictEqual(r.result.isError, false);
  assert.match(r.result.content[0].text, /brainstorming/);
});

test('list_categories: lists, and drills into one', async () => {
  const all = await call('tools/call', { name: 'list_categories', arguments: {} });
  assert.match(all.result.content[0].text, /Categories:/);
  const one = await call('tools/call', { name: 'list_categories', arguments: { category: 'marketing' } });
  assert.ok(!/not found/i.test(one.result.content[0].text), 'marketing should resolve to a category');
});

test('install_skill unknown → isError + not found', async () => {
  const r = await call('tools/call', { name: 'install_skill', arguments: { skill: 'zzz-nope-skill' } });
  assert.strictEqual(r.result.isError, true);
  assert.match(r.result.content[0].text, /not found/i);
});

test('unknown method → -32601; unknown tool → isError; missing arg → isError', async () => {
  assert.strictEqual((await call('does/not/exist')).error.code, -32601);
  assert.strictEqual((await call('tools/call', { name: 'nope', arguments: {} })).result.isError, true);
  assert.strictEqual((await call('tools/call', { name: 'search_skills', arguments: {} })).result.isError, true);
});

test('internal error on a request with id → -32603 (never hangs the client)', async () => {
  // malformed data makes the tool call throw inside callTool; handle must still respond
  const r = await handle({ jsonrpc: '2.0', id: 42, method: 'tools/call', params: { name: 'list_categories', arguments: {} } }, { data: {} });
  assert.strictEqual(r.id, 42);
  assert.strictEqual(r.error.code, -32603);
});

test('search_skills: invalid limit → isError; truncation shows a "see all" hint', async () => {
  const bad = await call('tools/call', { name: 'search_skills', arguments: { query: 'seo', limit: -5 } });
  assert.strictEqual(bad.result.isError, true);
  assert.match(bad.result.content[0].text, /limit/i);
  const trunc = await call('tools/call', { name: 'search_skills', arguments: { query: 'seo', limit: 1 } });
  assert.strictEqual(trunc.result.isError, false);
  assert.match(trunc.result.content[0].text, /to see all/);
});
