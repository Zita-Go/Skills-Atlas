// Filesystem helpers for installing skill folders into .claude/skills/.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

// Where skills get installed. Global => ~/.claude/skills, project => ./.claude/skills.
function installTargetDir({ global }) {
  const root = global ? os.homedir() : process.cwd();
  return path.join(root, '.claude', 'skills');
}

// Scopes to act on from --global / --project flags (default: both).
function scopesFor(values) {
  const g = { name: 'global', root: installTargetDir({ global: true }) };
  const p = { name: 'project', root: installTargetDir({ global: false }) };
  if (values.project && !values.global) return [p];
  if (values.global && !values.project) return [g];
  return [g, p];
}

function dirExists(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function mkdtemp(prefix = 'skills-atlas-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeFileMkdir(file, buf) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, buf);
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

// Atomically move a staged folder into place, replacing any existing dest.
function swapDir(tmp, dest) {
  ensureDir(path.dirname(dest));
  if (dirExists(dest)) rmrf(dest);
  fs.cpSync(tmp, dest, { recursive: true });
  rmrf(tmp);
}

// Pretty path with ~ for the home dir.
function tildify(p) {
  const home = os.homedir();
  return p.startsWith(home) ? '~' + p.slice(home.length) : p;
}

// Executable/script files in a skill folder, by extension (for the install
// transparency heads-up). Conservative: extension-based, won't catch every
// extensionless executable, so the provenance note is always shown regardless.
const SCRIPT_RE = /\.(sh|bash|zsh|fish|command|js|cjs|mjs|ts|tsx|jsx|py|rb|pl|ps1|psm1|bat|cmd)$/i;
function scriptFiles(rels) {
  return (rels || []).filter(r => SCRIPT_RE.test(r));
}

// Stable content hash of a folder, for drift detection on upgrade.
function hashFiles(files) {
  const h = crypto.createHash('sha256');
  for (const f of [...files].sort((a, b) => (a.rel < b.rel ? -1 : 1))) {
    h.update(f.rel); h.update('\0'); h.update(f.data); h.update('\0');
  }
  return h.digest('hex').slice(0, 16);
}

// Same hash, read from an installed directory on disk.
function hashDir(dir) {
  const files = [];
  const walk = (d, base) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const rel = base ? `${base}/${e.name}` : e.name;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, rel);
      else files.push({ rel, data: fs.readFileSync(p) });
    }
  };
  walk(dir, '');
  return hashFiles(files);
}

module.exports = {
  installTargetDir, scopesFor, dirExists, ensureDir, mkdtemp,
  writeFileMkdir, rmrf, swapDir, tildify, scriptFiles, hashFiles, hashDir,
};
