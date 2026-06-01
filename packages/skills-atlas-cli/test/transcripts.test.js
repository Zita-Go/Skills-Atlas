'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function setup(lines) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-tx-'));
  const proj = path.join(home, '.claude', 'projects', 'p1');
  fs.mkdirSync(proj, { recursive: true });
  fs.writeFileSync(path.join(proj, 's1.jsonl'), lines.join('\n') + '\n');
  process.env.HOME = home;
  delete require.cache[require.resolve('../src/transcripts')];
  return require('../src/transcripts');
}
const userStr = (text, ts) => JSON.stringify({ type: 'user', isSidechain: false, message: { role: 'user', content: text }, timestamp: new Date(ts).toISOString(), cwd: '/x' });
const toolResult = ts => JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', content: 'x' }] }, timestamp: new Date(ts).toISOString() });
const assistant = ts => JSON.stringify({ type: 'assistant', message: { role: 'assistant', content: 'hi' }, timestamp: new Date(ts).toISOString() });
const sidechain = (text, ts) => JSON.stringify({ type: 'user', isSidechain: true, message: { role: 'user', content: text }, timestamp: new Date(ts).toISOString() });

test('extracts only real typed prompts, newest-first', () => {
  const now = 1700000000000;
  const tx = setup([
    userStr('first real prompt', now - 3000),
    toolResult(now - 2500),
    assistant(now - 2000),
    sidechain('subagent prompt', now - 1500),
    userStr('<command-name>/config</command-name>', now - 1200),
    userStr('second real prompt', now - 1000),
  ]);
  const r = tx.recentPrompts({ now, windowDays: 30, max: 60 });
  assert.deepStrictEqual(r.map(x => x.text), ['second real prompt', 'first real prompt']);
});

test('windows by timestamp and caps count', () => {
  const now = 1700000000000;
  const DAY = 86400000;
  const tx = setup([
    userStr('old one', now - 40 * DAY),
    userStr('recent a', now - 2 * DAY),
    userStr('recent b', now - 1 * DAY),
  ]);
  const r = tx.recentPrompts({ now, windowDays: 21, max: 1 });
  assert.strictEqual(r.length, 1);
  assert.strictEqual(r[0].text, 'recent b');
  const r2 = tx.recentPrompts({ now, windowDays: 21, max: 60 });
  assert.deepStrictEqual(r2.map(x => x.text), ['recent b', 'recent a']);
});

test('no projects dir → empty, no throw', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-tx-'));
  process.env.HOME = home;
  delete require.cache[require.resolve('../src/transcripts')];
  assert.deepStrictEqual(require('../src/transcripts').recentPrompts({ now: Date.now() }), []);
});
