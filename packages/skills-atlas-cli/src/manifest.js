// Per-target install ledger: <skills-root>/.skills-atlas.json. Turns the opaque
// .claude/skills directory into a managed inventory — the keystone that lets
// `installed` / future `outdated` / `upgrade` / `remove` / `sync` work.
// (A dotfile, so Claude Code never loads it as a skill.)
'use strict';

const fs = require('fs');
const path = require('path');

const FILE = '.skills-atlas.json';

const fileFor = root => path.join(root, FILE);

function read(root) {
  try {
    const m = JSON.parse(fs.readFileSync(fileFor(root), 'utf8'));
    if (!m.skills) m.skills = {};
    return m;
  } catch {
    return { version: 1, skills: {} };
  }
}

function write(root, m) {
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(fileFor(root), JSON.stringify(m, null, 2) + '\n');
}

// Upsert one installed skill.
function record(root, entry) {
  const m = read(root);
  m.skills[entry.skill] = {
    source: entry.source || null,
    repo: entry.repo || null,
    branch: entry.branch || null,
    group: entry.group || null,
    category: entry.category || null,
    files: entry.files ?? null,
    scripts: entry.scripts ?? 0,
    installedAt: entry.installedAt || null,
  };
  write(root, m);
}

function remove(root, skill) {
  const m = read(root);
  if (m.skills[skill]) { delete m.skills[skill]; write(root, m); return true; }
  return false;
}

function list(root) {
  const m = read(root);
  return Object.entries(m.skills).map(([skill, v]) => ({ skill, ...v }));
}

module.exports = { read, write, record, remove, list, fileFor, FILE };
