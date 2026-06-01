// Shared install primitive used by both `install` (single + chain) and `upgrade`.
'use strict';

const path = require('path');
const { getSkillFolder } = require('./github');
const fsu = require('./fsutil');
const manifest = require('./manifest');

const hasSkillMd = rels => rels.some(r => {
  const x = r.toLowerCase();
  return x === 'skill.md' || x.endsWith('/skill.md');
});

// Download a skill's folder, atomically install into dest, and record the
// manifest (with a content hash for drift detection on upgrade).
// Returns { dest, fileCount, scripts, branchUsed, note, hash }. Throws on failure.
async function installFolder({ author, repo, branch, docPath, dest, targetRoot, skillName, source, group, category }) {
  const folder = await getSkillFolder({ author, repo, branch, docPath });
  const tmp = fsu.mkdtemp();
  try {
    for (const f of folder.files) fsu.writeFileMkdir(path.join(tmp, f.rel), f.data);
    const rels = folder.files.map(f => f.rel);
    if (!hasSkillMd(rels)) throw new Error('no SKILL.md found in downloaded folder');
    fsu.swapDir(tmp, dest);
    const scripts = fsu.scriptFiles(rels);
    const hash = fsu.hashFiles(folder.files);
    manifest.record(targetRoot, {
      skill: skillName, source, repo, branch: folder.branchUsed,
      group, category, files: rels.length, scripts: scripts.length, hash,
      installedAt: new Date().toISOString(),
    });
    return { dest, fileCount: rels.length, scripts, branchUsed: folder.branchUsed, note: folder.note, hash };
  } catch (e) {
    fsu.rmrf(tmp);
    throw e;
  }
}

module.exports = { installFolder, hasSkillMd };
