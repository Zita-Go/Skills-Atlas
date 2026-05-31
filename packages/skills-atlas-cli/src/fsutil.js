// Filesystem helpers for installing skill folders into .claude/skills/.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// Where skills get installed. Global => ~/.claude/skills, project => ./.claude/skills.
function installTargetDir({ global }) {
  const root = global ? os.homedir() : process.cwd();
  return path.join(root, '.claude', 'skills');
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

module.exports = {
  installTargetDir, dirExists, ensureDir, mkdtemp,
  writeFileMkdir, rmrf, swapDir, tildify, scriptFiles,
};
