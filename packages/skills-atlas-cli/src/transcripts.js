// Read the user's recent TYPED prompts from Claude Code's local session transcripts
// (JSONL under ~/.claude/projects/<proj>/<session>.jsonl). We store nothing new —
// this is the user's own data, read locally, only ever shown to the local Claude.
// Validated against real transcripts: a typed prompt has type:"user",
// message.role:"user", and a STRING content (tool results have array content).
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const DAY = 86400000;
const MAX_BYTES = 1_500_000; // cap per-file read (hook runs under a 5s timeout); recent prompts are at the file's tail
const projectsDir = () => path.join(os.homedir(), '.claude', 'projects');

function fromFile(file, sinceMs) {
  const out = [];
  let text;
  try {
    const st = fs.statSync(file);
    if (st.size <= MAX_BYTES) {
      text = fs.readFileSync(file, 'utf8');
    } else {
      // tail-read only the last MAX_BYTES, then drop the partial first line
      const fd = fs.openSync(file, 'r');
      try {
        const b = Buffer.alloc(MAX_BYTES);
        fs.readSync(fd, b, 0, MAX_BYTES, st.size - MAX_BYTES);
        text = b.toString('utf8');
      } finally { fs.closeSync(fd); }
      const nl = text.indexOf('\n');
      text = nl >= 0 ? text.slice(nl + 1) : text;
    }
  } catch { return out; }
  for (const line of text.split('\n')) {
    if (!line) continue;
    let o; try { o = JSON.parse(line); } catch { continue; }
    if (o.type !== 'user' || o.isSidechain) continue;
    const m = o.message;
    if (!m || m.role !== 'user' || typeof m.content !== 'string') continue;
    const t = m.content.trim();
    if (!t || t.startsWith('<') || t.includes('<command-name>') || t.includes('<local-command')) continue;
    const ts = Date.parse(o.timestamp);
    if (!Number.isFinite(ts) || (sinceMs && ts < sinceMs)) continue; // drop missing/unparseable/out-of-window
    out.push({ text: t, ts, cwd: o.cwd || null });
  }
  return out;
}

function recentPrompts({ windowDays = 21, max = 60, now = Date.now() } = {}) {
  const sinceMs = now - windowDays * DAY;
  const dir = projectsDir();
  const files = [];
  try {
    for (const proj of fs.readdirSync(dir)) {
      const pdir = path.join(dir, proj);
      let entries; try { entries = fs.readdirSync(pdir); } catch { continue; }
      for (const f of entries) {
        if (!f.endsWith('.jsonl')) continue;
        const fp = path.join(pdir, f);
        let mt = 0; try { mt = fs.statSync(fp).mtimeMs; } catch { /* ignore */ }
        if (mt >= sinceMs) files.push({ fp, mt });
      }
    }
  } catch { return []; }
  files.sort((a, b) => b.mt - a.mt);
  let all = [];
  for (const { fp } of files.slice(0, 40)) all = all.concat(fromFile(fp, sinceMs));
  all.sort((a, b) => b.ts - a.ts);
  return all.slice(0, max);
}

module.exports = { recentPrompts, fromFile, projectsDir };
