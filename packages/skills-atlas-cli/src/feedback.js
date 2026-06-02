// Local suppression memory for the autopilot. Two scopes, because the two signals
// mean different things:
//
//   • dismiss  — you explicitly said "never suggest this skill"        → GLOBAL table
//   • removed  — you removed a project-scoped skill you'd installed     → PROJECT table
//
// A dismiss is a deliberate, blanket "no", so it applies everywhere. A removal is
// contextual ("done with it here") — it must NOT leak to other projects, so it lives
// in a per-project table keyed by the project root. The LATEST action per skill wins:
// installing a skill clears both its global dismiss and this project's removal.
//
// All local; project tables live under the cache (keyed by path hash), never in the
// repo, so personal suppression is never committed. Nothing is sent anywhere.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const MAX_EVENTS = 500;

function baseDir() {
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(base, 'skills-atlas');
}
function globalFile() { return path.join(baseDir(), 'feedback.json'); }
function projectFile(root) {
  const key = crypto.createHash('sha1').update(path.resolve(root || process.cwd())).digest('hex').slice(0, 16);
  return path.join(baseDir(), 'projects', `${key}.json`);
}

function readStore(file) {
  try { const s = JSON.parse(fs.readFileSync(file, 'utf8')); if (!Array.isArray(s.events)) s.events = []; return s; }
  catch { return { events: [] }; }
}
function writeStore(file, s) {
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(s)); } catch { /* best-effort */ }
}
function append(file, skill, signal) {
  if (!skill || !signal) return;
  const s = readStore(file);
  s.events.push({ skill, signal, at: new Date().toISOString() });
  if (s.events.length > MAX_EVENTS) s.events = s.events.slice(-MAX_EVENTS);
  writeStore(file, s);
}

// Pure: skills whose MOST RECENT action in this store is the suppressing signal.
// (An 'accepted' afterwards clears it — you installed it, so you changed your mind.)
function suppressedFrom(events, suppressSignal) {
  const latest = new Map();
  for (const e of events || []) {
    if (!e || !e.skill) continue;
    const prev = latest.get(e.skill);
    if (!prev || Date.parse(e.at) >= Date.parse(prev.at)) latest.set(e.skill, e);
  }
  const out = new Set();
  for (const [skill, e] of latest) if (e.signal === suppressSignal) out.add(skill);
  return out;
}

// --- writes ---
function dismiss(skill) { append(globalFile(), skill, 'dismissed'); }              // explicit "never, anywhere"
function removedInProject(skill, root) { append(projectFile(root), skill, 'removed'); } // "not in this project"
function installed(skill, root) { append(globalFile(), skill, 'accepted'); append(projectFile(root), skill, 'accepted'); }

// --- reads ---
function globalDismissed() { return suppressedFrom(readStore(globalFile()).events, 'dismissed'); }
function projectRemoved(root) { return suppressedFrom(readStore(projectFile(root)).events, 'removed'); }

// Merged view for the autopilot hook, which runs in a project cwd: a skill is hidden
// if it's globally dismissed OR removed in this project.
function current(root) {
  const global = globalDismissed();
  const project = projectRemoved(root);
  const suppressed = new Set([...global, ...project]);
  return { suppressed, isSuppressed: s => suppressed.has(s), global, project };
}

function clear(root) { writeStore(globalFile(), { events: [] }); writeStore(projectFile(root), { events: [] }); }

module.exports = {
  globalFile, projectFile, readStore, writeStore,
  dismiss, removedInProject, installed,
  globalDismissed, projectRemoved, current, clear,
};
