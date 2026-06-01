// The only thing capability-gaps persists: which suggestions the user dismissed,
// and when we last proactively nudged. (Judgment is Claude's; no prompt text here.)
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

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
function touchNudge() { const s = read(); s.lastNudge = Date.now(); write(s); }
function clear() { write({ dismissed: [], lastNudge: 0 }); }

module.exports = { file, read, write, dismiss, isDismissed, touchNudge, clear };
