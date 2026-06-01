// Capability-gap tally: which KINDS of work (catalog group) the user keeps doing
// (high-confidence matches) without an installed skill. Aggregate counts only —
// never prompt text. Stored at ~/.cache/skills-atlas/gaps.json.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const DAY = 86400000;
const THRESHOLD = () => Number(process.env.SKILLS_ATLAS_GAP_THRESHOLD) || 5;
const WINDOW_MS = () => (Number(process.env.SKILLS_ATLAS_GAP_WINDOW_DAYS) || 30) * DAY;

function storeFile() {
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(base, 'skills-atlas', 'gaps.json');
}
function readStore() {
  try {
    const s = JSON.parse(fs.readFileSync(storeFile(), 'utf8'));
    s.groups = s.groups || {}; s.dismissed = s.dismissed || {}; s.alerted = s.alerted || {};
    return s;
  } catch { return { version: 1, groups: {}, dismissed: {}, alerted: {} }; }
}
function writeStore(s) {
  try { fs.mkdirSync(path.dirname(storeFile()), { recursive: true }); fs.writeFileSync(storeFile(), JSON.stringify(s)); } catch { /* ignore */ }
}
function recordEvent(s, { group, skill, now }) {
  if (!group || !skill) return s;
  const g = s.groups[group] || (s.groups[group] = { events: [], skills: {} });
  g.events.push(now);
  g.skills[skill] = (g.skills[skill] || 0) + 1;
  return s;
}
function pruneOld(s, now, windowMs = WINDOW_MS()) {
  for (const [name, g] of Object.entries(s.groups || {})) {
    g.events = (g.events || []).filter(ts => ts >= 0 && now - ts < windowMs);
    if (!g.events.length) delete s.groups[name];
  }
  return s;
}
// installed: Set of installed skill names.
function computeGaps(s, { now, windowMs = WINDOW_MS(), threshold = THRESHOLD(), installed = new Set() } = {}) {
  const out = [];
  for (const [group, g] of Object.entries((s && s.groups) || {})) {
    const events = (g.events || []).filter(ts => now - ts < windowMs);
    if (events.length < threshold) continue;
    if (s.dismissed && s.dismissed[group]) continue;
    const cand = Object.entries(g.skills || {})
      .filter(([sk]) => !installed.has(sk))
      .sort((a, b) => b[1] - a[1]);
    if (!cand.length) continue; // already covered (all matched skills installed)
    out.push({
      group, count: events.length,
      firstTs: Math.min(...events), lastTs: Math.max(...events),
      recommended: cand[0][0], skills: Object.fromEntries(cand),
    });
  }
  return out.sort((a, b) => b.count - a.count);
}
function dismiss(s, group, now) { s.dismissed = s.dismissed || {}; s.dismissed[group] = now; return s; }
function clearStore() { writeStore({ version: 1, groups: {}, dismissed: {}, alerted: {} }); }

module.exports = { storeFile, readStore, writeStore, recordEvent, pruneOld, computeGaps, dismiss, clearStore, THRESHOLD, WINDOW_MS };
