'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Collect every event written to the telemetry outbox for a given cache dir.
function outboxEvents(cache) {
  const outbox = path.join(cache, 'skills-atlas', 'telemetry-outbox');
  const files = fs.existsSync(outbox) ? fs.readdirSync(outbox) : [];
  return files.flatMap(f => JSON.parse(fs.readFileSync(path.join(outbox, f), 'utf8')).events);
}

// Fresh-require localskills + telemetry against the given cwd/cache, run fn, flush, return events.
function run(dir, cache, fn) {
  Object.assign(process.env, {
    XDG_CONFIG_HOME: path.join(dir, 'cfg'),
    XDG_CACHE_HOME: cache,
    SKILLS_ATLAS_TELEMETRY_ENDPOINT: 'https://test.invalid/event',
  });
  delete process.env.DO_NOT_TRACK;
  const cwd = process.cwd();
  try {
    process.chdir(dir);
    delete require.cache[require.resolve('../src/telemetry')];
    delete require.cache[require.resolve('../src/localskills')];
    const ls = require('../src/localskills');
    const tel = require('../src/telemetry');
    fn(ls);
    tel._flushNow({ spawn: false });
  } finally { process.chdir(cwd); }
  return outboxEvents(cache).filter(e => e.type === 'skill_created');
}

test('baselines pre-existing skills (no emit), then emits once for a fresh post-baseline craft', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-ls-'));
  const skills = path.join(dir, '.claude', 'skills');
  // an open-source / built-in skill that is present BEFORE our first scan
  fs.mkdirSync(path.join(skills, 'preexisting'), { recursive: true });
  fs.writeFileSync(path.join(skills, 'preexisting', 'SKILL.md'), '# pre');

  const created = run(dir, path.join(dir, 'cache'), ls => {
    ls.reportCreated();           // first run → baseline; 'preexisting' must NOT emit
    // now a brand-new skill is crafted (fresh mtime) — the genuine creation
    fs.mkdirSync(path.join(skills, 'mycraft'), { recursive: true });
    fs.writeFileSync(path.join(skills, 'mycraft', 'SKILL.md'), '# new');
    ls.reportCreated();           // post-baseline + fresh → emits
    ls.reportCreated();           // seen-cache suppresses the duplicate
  });

  assert.equal(created.length, 1);            // exactly one, despite a pre-existing skill + 3 scans
  assert.equal(created[0].target, 'mycraft'); // NOT 'preexisting'
});

test('ignores a post-baseline skill whose SKILL.md is stale (copied-in open-source, not a craft)', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-ls-old-'));
  const skills = path.join(dir, '.claude', 'skills');
  fs.mkdirSync(skills, { recursive: true });   // empty dir → baseline sees nothing

  const created = run(dir, path.join(dir, 'cache'), ls => {
    ls.reportCreated();           // first run → baseline (empty project)
    // drop in an old open-source skill: SKILL.md mtime backdated 10 days
    fs.mkdirSync(path.join(skills, 'opensource'), { recursive: true });
    const file = path.join(skills, 'opensource', 'SKILL.md');
    fs.writeFileSync(file, '# os');
    const tenDaysAgo = Date.now() / 1000 - 10 * 86400;
    fs.utimesSync(file, tenDaysAgo, tenDaysAgo);
    ls.reportCreated();           // post-baseline but stale mtime → must NOT emit
  });

  assert.equal(created.length, 0);
});
