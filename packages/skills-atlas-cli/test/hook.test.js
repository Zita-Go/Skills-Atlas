'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const hook = require('../src/commands/hook');
const hasOurs = s => ((s.hooks || {}).UserPromptSubmit || [])
  .some(e => e.hooks.some(h => h.command.includes('skills-atlas suggest')));

test('hook on/off edits settings.json idempotently, preserves other settings, removes cleanly', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-home-'));
  const oldHome = process.env.HOME;
  process.env.HOME = home;
  const log = console.log, errfn = console.error;
  console.log = () => {}; console.error = () => {};
  try {
    const sp = path.join(home, '.claude', 'settings.json');
    fs.mkdirSync(path.dirname(sp), { recursive: true });
    fs.writeFileSync(sp, JSON.stringify({ model: 'opus', hooks: { Stop: [{ matcher: '*', hooks: [{ type: 'command', command: 'other' }] }] } }));

    await hook(['on']);
    let s = JSON.parse(fs.readFileSync(sp, 'utf8'));
    assert.ok(hasOurs(s), 'our hook registered');
    assert.strictEqual(s.model, 'opus', 'unrelated setting preserved');
    assert.ok(s.hooks.Stop, 'unrelated hook preserved');

    await hook(['on']); // idempotent
    s = JSON.parse(fs.readFileSync(sp, 'utf8'));
    assert.strictEqual(s.hooks.UserPromptSubmit.length, 1, 'no duplicate on re-enable');

    await hook(['off']);
    s = JSON.parse(fs.readFileSync(sp, 'utf8'));
    assert.ok(!hasOurs(s), 'our hook removed');
    assert.strictEqual(s.model, 'opus', 'still preserved after off');
    assert.ok(s.hooks.Stop, 'other hooks kept after off');
  } finally {
    console.log = log; console.error = errfn;
    process.env.HOME = oldHome;
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('hook on degrades gracefully on malformed settings shapes (never crashes)', async () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-home-'));
  const oldHome = process.env.HOME;
  process.env.HOME = home;
  const log = console.log, errfn = console.error;
  console.log = () => {}; console.error = () => {};
  try {
    const sp = path.join(home, '.claude', 'settings.json');
    fs.mkdirSync(path.dirname(sp), { recursive: true });
    for (const bad of [{ hooks: 'oops' }, { hooks: { UserPromptSubmit: 'oops' } }, { hooks: [] }]) {
      fs.writeFileSync(sp, JSON.stringify(bad));
      await assert.doesNotReject(hook(['on']));
      const s = JSON.parse(fs.readFileSync(sp, 'utf8'));
      assert.ok(hasOurs(s), 'our hook registered despite the malformed shape');
    }
  } finally {
    console.log = log; console.error = errfn;
    process.env.HOME = oldHome;
    fs.rmSync(home, { recursive: true, force: true });
  }
});
