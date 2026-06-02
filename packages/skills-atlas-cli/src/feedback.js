// Local feedback loop for the autopilot: learn from what the user actually does, so
// suggestions get sharper the more it's used. Three clean signals only — no guessing:
//   accepted  (installed a skill)            → + affinity for its category
//   regret    (installed then removed soon)  → suppress that skill + - affinity
//   dismissed (explicitly "stop suggesting") → suppress that skill
// All local (~/.cache), private, bounded, decayed. Cold start = no effect.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const HALF_LIFE_DAYS = 45;        // signals fade with age
const REGRET_DAYS = 7;            // install → remove within this window counts as regret
const W = { accepted: 1, regret: -1.5 }; // per-event category weight
const AFF_K = 0.25;              // how hard net affinity bends the ranking multiplier
const AFF_MIN = 0.6, AFF_MAX = 1.4; // the multiplier never goes outside this (gentle, no filter bubble)
const MAX_EVENTS = 500;

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
  if (!ev || !ev.skill || !W.hasOwnProperty(ev.signal) && ev.signal !== 'dismissed') return;
  const s = read();
  s.events.push({ skill: ev.skill, category: ev.category || null, signal: ev.signal, at: new Date().toISOString() });
  if (s.events.length > MAX_EVENTS) s.events = s.events.slice(-MAX_EVENTS);
  write(s);
}
function clear() { write({ events: [] }); }

// Pure: build a usage profile from events. `now` injectable for tests.
function profile(events, now = Date.now()) {
  const decay = at => { const t = Date.parse(at); return Number.isFinite(t) ? Math.pow(0.5, (now - t) / (HALF_LIFE_DAYS * 86400000)) : 0; };
  const catNet = new Map();   // category → decayed net affinity
  const latest = new Map();   // skill → most-recent event (latest signal wins)
  for (const e of events || []) {
    if (!e || !e.skill) continue;
    const w = (W[e.signal] || 0) * decay(e.at);
    if (e.category && w) catNet.set(e.category, (catNet.get(e.category) || 0) + w);
    const prev = latest.get(e.skill);
    if (!prev || Date.parse(e.at) >= Date.parse(prev.at)) latest.set(e.skill, e);
  }
  const suppressed = new Set();
  for (const [skill, e] of latest) if (e.signal === 'dismissed' || e.signal === 'regret') suppressed.add(skill);
  const affinity = cat => Math.max(AFF_MIN, Math.min(AFF_MAX, 1 + AFF_K * (catNet.get(cat) || 0)));
  return { affinity, isSuppressed: s => suppressed.has(s), suppressed, catNet };
}

function current(now) { return profile(read().events, now); }

module.exports = { file, read, write, record, clear, profile, current, REGRET_DAYS, HALF_LIFE_DAYS };
