'use strict';
// Tiny record of skills the autopilot recently surfaced, so `install` can detect an "accept".
// Cache-scoped (not config); bounded; fail-silent.
const fs = require('fs');
const os = require('os');
const path = require('path');
const file = () => path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'skills-atlas', 'autopilot-suggested.json');
const TTL_MS = 60 * 60 * 1000;

function read() { try { return JSON.parse(fs.readFileSync(file(), 'utf8')); } catch { return {}; } }
function write(o) { try { fs.mkdirSync(path.dirname(file()), { recursive: true }); fs.writeFileSync(file(), JSON.stringify(o)); } catch { /* ignore */ } }

function recordSuggested(names) {
  const o = read(); const now = Date.now();
  for (const n of names || []) o[n] = now;
  for (const k of Object.keys(o)) if (now - o[k] > TTL_MS) delete o[k];
  write(o);
}
function wasRecentlySuggested(name) {
  const o = read(); const ts = o[name];
  return !!ts && Date.now() - ts <= TTL_MS;
}
module.exports = { recordSuggested, wasRecentlySuggested };
