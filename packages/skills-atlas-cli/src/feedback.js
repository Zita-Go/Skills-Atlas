// Local suppression memory for the autopilot: a skill you've explicitly dismissed is
// never suggested again — until you install it (the LATEST action wins, so re-adding
// it clears the dismiss). Removal is deliberately NOT a signal: cleaning up a finished
// project's skills shouldn't bury something you may want again. All local, private.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const MAX_EVENTS = 500;
const SIGNALS = new Set(['accepted', 'dismissed']);

function file() {
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(base, 'skills-atlas', 'feedback.json');
}
function read() {
  try { const s = JSON.parse(fs.readFileSync(file(), 'utf8')); if (!Array.isArray(s.events)) s.events = []; return s; }
  catch { return { events: [] }; }
}
function write(s) {
  try { fs.mkdirSync(path.dirname(file()), { recursive: true }); fs.writeFileSync(file(), JSON.stringify(s)); } catch { /* best-effort */ }
}
function record(ev) {
  if (!ev || !ev.skill || !SIGNALS.has(ev.signal)) return;
  const s = read();
  s.events.push({ skill: ev.skill, signal: ev.signal, at: new Date().toISOString() });
  if (s.events.length > MAX_EVENTS) s.events = s.events.slice(-MAX_EVENTS);
  write(s);
}
function clear() { write({ events: [] }); }

// Pure: skills to suppress = those whose MOST RECENT action was a dismiss.
// (An 'accepted' afterwards clears it — you installed it, so you changed your mind.)
function profile(events) {
  const latest = new Map();
  for (const e of events || []) {
    if (!e || !e.skill) continue;
    const prev = latest.get(e.skill);
    if (!prev || Date.parse(e.at) >= Date.parse(prev.at)) latest.set(e.skill, e);
  }
  const suppressed = new Set();
  for (const [skill, e] of latest) if (e.signal === 'dismissed') suppressed.add(skill);
  return { suppressed, isSuppressed: s => suppressed.has(s) };
}
function current() { return profile(read().events); }

module.exports = { file, read, write, record, clear, profile, current };
