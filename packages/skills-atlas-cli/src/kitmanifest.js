// The committable, project-root kit declaration: skills-atlas.kit.json.
// Distinct from the per-dir install ledger (.skills-atlas.json): this is the
// *intent* ("the kit for this project is X"), committed and shared; `sync` applies it.
'use strict';

const fs = require('fs');
const path = require('path');

const FILE = 'skills-atlas.kit.json';
const fileFor = root => path.join(root, FILE);

function read(root) {
  try { return JSON.parse(fs.readFileSync(fileFor(root), 'utf8')); } catch { return null; }
}

function write(root, m) {
  fs.writeFileSync(fileFor(root), JSON.stringify(m, null, 2) + '\n');
}

// Decide what `sync` should do per declared skill. `currentHash(name)` returns the
// on-disk content hash, or null/undefined if the skill isn't installed.
//   not installed            -> 'install'
//   installed, hash matches   -> 'up-to-date'
//   installed, hash differs   -> 'local-changes' (don't clobber edits without --force)
function planSync(manifest, currentHash) {
  return (manifest.skills || []).map(s => {
    const cur = currentHash(s.name);
    let action;
    if (!cur) action = 'install';
    else if (!s.hash || cur === s.hash) action = 'up-to-date';
    else action = 'local-changes';
    return { name: s.name, action, declared: s };
  });
}

module.exports = { FILE, fileFor, read, write, planSync };
