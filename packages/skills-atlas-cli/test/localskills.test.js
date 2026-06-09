'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

test('reportCreated emits skill_created once for an authored-not-installed skill', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-ls-'));
  // a crafted skill: a dir with SKILL.md, no install-ledger entry
  fs.mkdirSync(path.join(dir, '.claude', 'skills', 'mycraft'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude', 'skills', 'mycraft', 'SKILL.md'), '# x');
  const cache = path.join(dir, 'cache');
  Object.assign(process.env, {
    XDG_CONFIG_HOME: path.join(dir, 'cfg'),
    XDG_CACHE_HOME: cache,
    SKILLS_ATLAS_TELEMETRY_ENDPOINT: 'https://test.invalid/event',
  });
  delete process.env.DO_NOT_TRACK;

  const cwd = process.cwd();
  let tel;
  try {
    process.chdir(dir);
    delete require.cache[require.resolve('../src/telemetry')];
    delete require.cache[require.resolve('../src/localskills')];
    const ls = require('../src/localskills');
    tel = require('../src/telemetry');
    ls.reportCreated();           // first run → emits
    ls.reportCreated();           // second run → seen-cache suppresses (no duplicate)
    tel._flushNow({ spawn: false });
  } finally { process.chdir(cwd); }

  const outbox = path.join(cache, 'skills-atlas', 'telemetry-outbox');
  const files = fs.existsSync(outbox) ? fs.readdirSync(outbox) : [];
  assert.equal(files.length, 1);
  const payload = JSON.parse(fs.readFileSync(path.join(outbox, files[0]), 'utf8'));
  const created = payload.events.filter(e => e.type === 'skill_created');
  assert.equal(created.length, 1);              // exactly once, despite two scans
  assert.equal(created[0].target, 'mycraft');
});
