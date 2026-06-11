'use strict';
process.env.DO_NOT_TRACK = '1';   // info itself does not emit, but keep the suite phone-home-proof
const test = require('node:test');
const assert = require('node:assert');

// Capture console.log / console.error around an (async) command run, always restoring them.
function captureLog(fn) {
  const log = console.log; let out = '';
  console.log = (...a) => { out += a.join(' ') + '\n'; };
  return Promise.resolve(fn()).then(() => { console.log = log; return out; }, e => { console.log = log; throw e; });
}
function captureErr(fn) {
  const err = console.error; let out = '';
  console.error = (...a) => { out += a.join(' ') + '\n'; };
  return Promise.resolve(fn()).then(() => { console.error = err; return out; }, e => { console.error = err; throw e; });
}

const info = require('../src/commands/info');
const MISSING = 'definitely-not-a-real-skill-xyz';

test('info <missing> --json: clean found:false on stdout, exit stays 0 (a valid answer, not a crash)', async () => {
  process.exitCode = 0;
  const out = await captureLog(() => info([MISSING, '--json']));
  const j = JSON.parse(out);
  assert.equal(j.found, false);
  assert.equal(j.skill, MISSING);
  assert.equal(process.exitCode || 0, 0, 'not-found must NOT be a non-zero (error) exit');
  process.exitCode = 0;            // never leave the runner in a failed state
});

test('info <missing> human: stays exact (no fuzzy result), points at search, exit 0', async () => {
  process.exitCode = 0;
  const err = await captureErr(() => info([MISSING]));
  assert.match(err, /not found/);
  assert.match(err, /skills-atlas search/);
  assert.equal(process.exitCode || 0, 0);
  process.exitCode = 0;
});

test('info <real skill> --json: found:true (exact lookup preserved)', async () => {
  process.exitCode = 0;
  const out = await captureLog(() => info(['brainstorming', '--json']));
  const j = JSON.parse(out);
  assert.equal(j.found, true);
  assert.equal(j.skill, 'brainstorming');
  process.exitCode = 0;
});
