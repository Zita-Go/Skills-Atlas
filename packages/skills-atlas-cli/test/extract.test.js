'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');

const { extractTarGz } = require('../src/github');

let hasTar = true;
try { cp.execFileSync('tar', ['--version'], { stdio: 'ignore' }); } catch { hasTar = false; }

// Build a .tar.gz that mimics a GitHub repo archive: a top-level "<repo>-<ref>/"
// dir containing the target skill folder, a deeply-nested long path, and a
// SIBLING skill that must NOT be extracted.
function makeArchive(format) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-tar-'));
  const repo = path.join(root, 'myrepo-main');
  fs.mkdirSync(path.join(repo, 'skills/brainstorming/scripts'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'skills/brainstorming/SKILL.md'), '---\nname: brainstorming\n---\nbody');
  fs.writeFileSync(path.join(repo, 'skills/brainstorming/scripts/helper.js'), 'console.log(1)');
  const deep = path.join(repo, 'skills/brainstorming', 'a'.repeat(60), 'b'.repeat(60));
  fs.mkdirSync(deep, { recursive: true });
  fs.writeFileSync(path.join(deep, 'deep.txt'), 'deep');
  fs.mkdirSync(path.join(repo, 'skills/other'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'skills/other/SKILL.md'), 'OTHER_SKILL');
  const tgz = path.join(root, 'a.tgz');
  cp.execFileSync('tar', ['-C', root, `--format=${format}`, '-czf', tgz, 'myrepo-main']);
  const buf = fs.readFileSync(tgz);
  fs.rmSync(root, { recursive: true, force: true });
  return buf;
}

for (const fmt of ['gnu', 'pax']) {
  test(`extractTarGz pulls only the target folder (${fmt} format)`, { skip: !hasTar }, () => {
    const files = extractTarGz(makeArchive(fmt), 'skills/brainstorming');
    const rels = files.map(f => f.rel);
    assert.ok(rels.includes('SKILL.md'), 'has SKILL.md at folder root');
    assert.ok(rels.includes('scripts/helper.js'), 'preserves nested file');
    assert.ok(rels.some(r => r.endsWith('deep.txt')), 'handles >100-char long path');
    assert.ok(!files.some(f => f.data.toString() === 'OTHER_SKILL'), 'excludes the sibling skill');
    const skillMd = files.find(f => f.rel === 'SKILL.md');
    assert.ok(skillMd.data.toString().includes('name: brainstorming'), 'content intact');
  });
}
