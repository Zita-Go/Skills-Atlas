// Local suppression memory for the autopilot: skills you've explicitly dismissed, or
// installed and then quickly removed, are never suggested again. The LATEST action
// wins, so deliberately re-installing one un-suppresses it. All local (~/.cache),
// private. (Richer "preference" learning is deferred to where it can actually change
// an outcome — e.g. generative gap-filling — not a score that nudges nothing.)
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const REGRET_DAYS = 7;   // install → remove within this window counts as a regret
const MAX_EVENTS = 500;
const SIGNALS = new Set(['accepted', 'regret', 'dismissed']);

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

// Pure: skills to suppress = those whose MOST RECENT action was a dismiss or a regret.
// (An 'accepted' afterwards clears it — you changed your mind.)
function profile(events) {
  const latest = new Map();
  for (const e of events || []) {
    if (!e || !e.skill) continue;
    const prev = latest.get(e.skill);
    if (!prev || Date.parse(e.at) >= Date.parse(prev.at)) latest.set(e.skill, e);
  }
  const suppressed = new Set();
  for (const [skill, e] of latest) if (e.signal === 'dismissed' || e.signal === 'regret') suppressed.add(skill);
  return { suppressed, isSuppressed: s => suppressed.has(s) };
}
function current() { return profile(read().events); }

module.exports = { file, read, write, record, clear, profile, current, REGRET_DAYS };
