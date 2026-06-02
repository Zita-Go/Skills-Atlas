// The only thing capability-gaps persists: which suggestions the user dismissed,
// when we last proactively nudged, and a fingerprint of what the user was doing at
// that nudge. (Judgment is Claude's; no prompt text is stored — only token stems.)
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { tokenize } = require('./search-core');

// Gap nudges are gated by activity, not a wall clock: a short anti-spam floor, then
// a refire whenever the recurring work shifts to something new (so it can catch the
// user on their NEXT task), plus a long fallback so a persistent gap can resurface.
const MIN_INTERVAL_MS = 90 * 60 * 1000;          // ~90 min: never two nudges in a burst
const REFRESH_INTERVAL_MS = 12 * 60 * 60 * 1000; // ~12 h: an unchanged gap may resurface
const CRAFT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // ~7 d: never re-surface the SAME craft pattern

function file() {
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(base, 'skills-atlas', 'gaps.json');
}
function read() {
  try { const s = JSON.parse(fs.readFileSync(file(), 'utf8')); if (!Array.isArray(s.dismissed)) s.dismissed = []; return s; }
  catch { return { dismissed: [], lastNudge: 0 }; }
}
function write(s) {
  try { fs.mkdirSync(path.dirname(file()), { recursive: true }); fs.writeFileSync(file(), JSON.stringify(s)); } catch { /* ignore */ }
}
function dismiss(x) { const s = read(); if (x && !s.dismissed.includes(x)) s.dismissed.push(x); write(s); return s; }
function isDismissed(x) { return read().dismissed.includes(x); }
function touchNudge(sig) { const s = read(); s.lastNudge = Date.now(); if (sig) s.lastSig = sig; write(s); }
function clear() { write({ dismissed: [], lastNudge: 0, lastSig: [] }); }

// A pending result from the background gap sub-agent, surfaced by the hook next tick.
function writePending(p) { const s = read(); s.pending = { ...p, at: new Date().toISOString() }; write(s); }
function clearPending() { const s = read(); delete s.pending; write(s); }
function markAnalyze() { const s = read(); s.analyzeAt = new Date().toISOString(); write(s); }

// --- CRAFT (feature ②): a detected, craftable workflow the user can codify. ---
// Fingerprint the pattern (not the DELTA tail) so the same craft isn't re-nagged.
function craftFingerprint(line) {
  const core = String(line || '').replace(/^CRAFT:\s*/i, '').split('|')[0];
  return tokenize(core.toLowerCase()).sort().slice(0, 12).join(' ');
}
// Was this exact craft pattern surfaced within the cooldown? (the Cursor-failure guard)
function craftOnCooldown(fp, now = Date.now()) {
  const lc = read().lastCraft;
  return !!(lc && lc.fp === fp && now - Date.parse(lc.at) < CRAFT_COOLDOWN_MS);
}
// Stash the craftable pattern for the `craft` command, and remember we surfaced it.
function writeCraft({ line, pattern, fp }) {
  const s = read();
  const at = new Date().toISOString();
  s.craft = { line, pattern, at };
  s.lastCraft = { fp, at };
  write(s);
}
function readCraft() { return read().craft || null; }
function clearCraft() { const s = read(); delete s.craft; write(s); }

// A coarse fingerprint of recent work: the most frequent contentful tokens across
// recent prompts. When this set shifts, the user has moved to a new kind of work.
function activitySignature(prompts, topN = 8) {
  const freq = new Map();
  for (const p of prompts || []) {
    const text = typeof p === 'string' ? p : (p && p.text) || '';
    for (const t of tokenize(String(text).toLowerCase())) freq.set(t, (freq.get(t) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, topN).map(e => e[0]).sort();
}

// Did the dominant activity shift by more than half (Jaccard < 0.5)? No prior → yes.
function signatureShifted(sig, prev) {
  if (!prev || !prev.length) return true;
  const a = new Set(sig);
  if (!a.size) return false;
  const b = new Set(prev);
  let inter = 0; for (const x of a) if (b.has(x)) inter++;
  const union = new Set([...a, ...b]).size || 1;
  return inter / union < 0.5;
}

// Smart-refire decision (pure). Fire when past the anti-spam floor AND either the
// activity shifted to something new, or the long fallback has elapsed.
function shouldNudge(state, recent, now) {
  const sig = activitySignature(recent);
  const since = now - ((state && state.lastNudge) || 0);
  if (since < MIN_INTERVAL_MS) return { fire: false, sig };
  const fire = signatureShifted(sig, state && state.lastSig) || since >= REFRESH_INTERVAL_MS;
  return { fire, sig };
}

module.exports = {
  file, read, write, dismiss, isDismissed, touchNudge, clear,
  writePending, clearPending, markAnalyze,
  craftFingerprint, craftOnCooldown, writeCraft, readCraft, clearCraft,
  activitySignature, signatureShifted, shouldNudge,
  MIN_INTERVAL_MS, REFRESH_INTERVAL_MS, CRAFT_COOLDOWN_MS,
};
