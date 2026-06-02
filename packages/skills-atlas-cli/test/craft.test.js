'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const BIN = path.join(__dirname, '..', 'bin', 'skills.js');
const gaps = require('../src/commands/gaps');

test('gaps.craftEvidence: keeps fuller text than the 100-char detection truncation', () => {
  const long = 'always run our deploy.sh then ' + 'x'.repeat(300);
  const ev = gaps.craftEvidence([{ text: long, ts: Date.now() }]);
  assert.ok(ev.length > 150, 'keeps well past 100 chars (corrections need room)');
  assert.ok(ev.includes('deploy.sh'), 'carries the user-specific token');
});

test('gaps.craftInstruction: embeds the pattern and the evidence, no leftovers', () => {
  const ins = gaps.craftInstruction('cut a release with make ship', [{ text: 'tag then make ship', ts: Date.now() }]);
  assert.ok(ins.includes('cut a release with make ship'), 'pattern injected');
  assert.ok(ins.includes('make ship'), 'evidence injected');
  assert.ok(!/{{\w+}}/.test(ins), 'no leftover placeholders');
});

test('craft --json: surfaces a pending craft pattern flagged by the autopilot', () => {
  const cache = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-craft-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-home-')); // no ~/.claude/projects → no transcripts
  process.env.XDG_CACHE_HOME = cache;
  delete require.cache[require.resolve('../src/gapstate')];
  require('../src/gapstate').writeCraft({ line: 'CRAFT: cut a release | DELTA: make ship', pattern: 'cut a release', fp: 'fp1' });

  const out = execFileSync(process.execPath, [BIN, 'craft', '--json'], {
    env: { ...process.env, XDG_CACHE_HOME: cache, HOME: home, SKILLS_ATLAS_SUBCALL: '1' },
    encoding: 'utf8',
  });
  const j = JSON.parse(out);
  assert.strictEqual(j.fromAutopilot, true, 'reports it came from the autopilot');
  assert.strictEqual(j.pattern, 'cut a release', 'surfaces the detected pattern');
});
