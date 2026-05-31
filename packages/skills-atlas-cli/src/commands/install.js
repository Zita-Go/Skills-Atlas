'use strict';

const path = require('path');
const { parse } = require('../args');
const { loadData } = require('../data');
const { buildIndices, vendorsFor, suggestSkills, skillDocPath } = require('../index-build');
const { listSkillFiles, fetchRaw, fetchSkillFolderTar } = require('../github');
const fsu = require('../fsutil');
const { confirm, choose } = require('../prompt');
const { buildInfo, infoForRow, renderInfo, bold, dim, cyan, green, stars, safeAlt } = require('../format');

const HELP = `usage: skills-atlas install <skill> [options]

options:
  -g, --global       install to ~/.claude/skills/   (default)
      --project      install to ./.claude/skills/
  -s, --source <id>  pick a source when a skill has several
  -f, --force        overwrite if already installed
  -y, --yes          non-interactive (auto-pick top source, assume yes)
      --dry-run      show what would download, write nothing
      --json         machine-readable output

Downloads the repo archive (no GitHub API rate limit). Only if that fetch fails
does it fall back to the GitHub API (60/h unauthenticated) — set GITHUB_TOKEN to
raise that fallback to 5000/h.`;

function resolveGlobal(values) {
  if (values.project) return false;
  if (values.global) return true;
  return true; // default: global
}

module.exports = async function install(argv) {
  const { values, positionals } = parse(argv,
    ['global', 'project', 'source', 'force', 'yes', 'dry-run', 'json']);
  if (values.help) { console.log(HELP); return; }

  const name = positionals[0];
  if (!name) {
    console.error('usage: skills-atlas install <skill> [--global|--project] [--source <id>] [--force] [--yes]');
    process.exitCode = 1;
    return;
  }

  const { data } = loadData({ quiet: values.json });
  const idx = buildIndices(data);
  const candidates = vendorsFor(idx.skillIndex, name); // distinct vendors, best first

  if (candidates.length === 0) {
    const sugg = suggestSkills(idx.skillIndex, name);
    console.error(`skill '${name}' not found.`);
    if (sugg.length) console.error(`did you mean: ${sugg.join(', ')}`);
    console.error(`try: skills-atlas search ${name}`);
    process.exitCode = 1;
    return;
  }

  // --- pick the source vendor ---
  let chosen;
  if (values.source) {
    chosen = candidates.find(c => c.source.name.toLowerCase() === values.source.toLowerCase());
    if (!chosen) {
      console.error(`source '${values.source}' does not provide '${name}'.`);
      console.error(`available: ${candidates.map(c => c.source.name).join(', ')}`);
      process.exitCode = 1;
      return;
    }
  } else if (candidates.length === 1 || values.yes) {
    chosen = candidates[0];
  } else {
    const labels = candidates.map(c =>
      `${c.source.name}  ${stars(c.source.stars)}  ${c.source.type || ''}  ${(c.source.install && c.source.install.command) || ''}`);
    const i = await choose(`'${name}' is available from ${candidates.length} sources:`, labels);
    if (i < 0) {
      console.error(`multiple sources for '${name}'. re-run with --source <id> or --yes.`);
      console.error(`sources: ${candidates.map(c => c.source.name).join(', ')}`);
      process.exitCode = 2;
      return;
    }
    chosen = candidates[i];
  }

  // Heads-up when --yes auto-picked among semantically different groups.
  if (values.yes && candidates.length > 1) {
    const groups = [...new Set(candidates.map(c => c.row && c.row.group).filter(Boolean))];
    if (groups.length > 1) {
      const picked = chosen.row && chosen.row.group;
      const otherGroups = groups.filter(g => g !== picked).join('; ');
      const st = stars(chosen.source.stars);
      console.error(dim(`note: '${name}' exists in ${groups.length} groups; auto-picked ${chosen.source.name}${st ? ' ' + st : ''} (${picked || '?'}). also in: ${otherGroups} — use --source to choose.`));
    }
  }

  const v = chosen.vendor || {};
  const src = chosen.source;
  const skill = chosen.skill || name; // canonical skill name from the index
  const author = v.author || src.author;
  const repo = v.repo || src.repo;
  const branch = v.default_branch || src.default_branch || 'main';
  const docPath = skillDocPath(v, skill);
  const installCmd = src.install || v.install || null;

  // --- fallback: no per-skill folder -> whole-repo installer (valid outcome) ---
  if (!docPath) {
    if (values.json) {
      console.log(JSON.stringify({ skill: name, mode: 'whole-repo', source: src.name, install: installCmd }));
      return;
    }
    console.log(`\n'${name}' from ${bold(src.name)} (type=${src.type}) installs the whole repo, not a single folder.`);
    if (installCmd && installCmd.command) {
      console.log(`run:\n   ${cyan(installCmd.command)}`);
      const alt = safeAlt(installCmd.alt);
      if (alt) console.log(`alt:\n   ${alt}`);
      if (installCmd.note) console.log(dim('   ' + installCmd.note));
    } else {
      console.log(`see ${src.url}`);
    }
    return; // exit 0
  }

  if (!author || !repo) {
    console.error(`missing author/repo for source '${src.name}'; cannot download.`);
    process.exitCode = 1;
    return;
  }

  const targetRoot = fsu.installTargetDir({ global: resolveGlobal(values) });
  const dest = path.join(targetRoot, skill); // folder = skill name (strips repo nesting)

  // --- already installed? ---
  if (fsu.dirExists(dest) && !values['dry-run']) {
    if (!values.force) {
      if (values.yes) {
        console.error(`'${name}' already installed at ${fsu.tildify(dest)} (use --force to overwrite).`);
        process.exitCode = 1;
        return;
      }
      const ok = await confirm(`${fsu.tildify(dest)} exists. overwrite?`, false);
      if (!ok) { console.log('aborted.'); return; }
    }
  }

  // --- dry-run: preview the file list via the tree API (light) ---
  if (values['dry-run']) {
    let listing;
    try {
      listing = await listSkillFiles({ author, repo, branch, docPath });
    } catch (e) {
      console.error(`failed to read ${author}/${repo}: ${e.message}`);
      process.exitCode = 1;
      return;
    }
    if (values.json) {
      console.log(JSON.stringify({
        skill: name, mode: 'folder', dest,
        files: listing.files.length,
        scripts: fsu.scriptFiles(listing.files.map(f => f.rel)).length,
        branch: listing.branchUsed, dryRun: true,
      }));
      return;
    }
    console.log(`would install ${listing.files.length} file(s) to ${fsu.tildify(dest)} (branch ${listing.branchUsed}):`);
    listing.files.forEach(f => console.log(`  ${f.rel}`));
    if (listing.note) console.log(dim('  ' + listing.note));
    console.log(dim('  (real install fetches the repo archive — no GitHub API rate limit)'));
    return;
  }

  // --- download into a tmp dir, then atomically swap into place ---
  // Primary: one repo-archive download from codeload (not GitHub-API rate-limited);
  // extract only this skill's folder. Fallback: tree API + raw per file.
  const tmp = fsu.mkdtemp();
  let branchUsed, fileCount, note = null, scripts = [];
  try {
    let folder = null;
    try {
      folder = await fetchSkillFolderTar({ author, repo, branch, docPath });
    } catch (e) {
      note = `archive download failed (${e.message}); fell back to the GitHub API`;
    }

    let rels;
    if (folder && folder.files.length) {
      branchUsed = folder.branchUsed;
      for (const f of folder.files) fsu.writeFileMkdir(path.join(tmp, f.rel), f.data);
      rels = folder.files.map(f => f.rel);
    } else {
      const listing = await listSkillFiles({ author, repo, branch, docPath });
      branchUsed = listing.branchUsed;
      if (listing.note) note = listing.note;
      for (const f of listing.files) {
        const buf = await fetchRaw(author, repo, listing.branchUsed, f.path);
        fsu.writeFileMkdir(path.join(tmp, f.rel), buf);
      }
      rels = listing.files.map(f => f.rel);
    }

    const hasSkillMd = rels.some(rel => {
      const r = rel.toLowerCase();
      return r === 'skill.md' || r.endsWith('/skill.md');
    });
    if (!hasSkillMd) throw new Error('no SKILL.md found in downloaded folder');
    fileCount = rels.length;
    scripts = fsu.scriptFiles(rels);
    fsu.swapDir(tmp, dest);
  } catch (e) {
    fsu.rmrf(tmp);
    console.error(`install failed: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  if (values.json) {
    console.log(JSON.stringify({
      skill: name, mode: 'folder', source: src.name,
      dest, files: fileCount, scripts: scripts.length, branch: branchUsed,
    }));
    return;
  }

  console.log(`\n${green('✓')} installed ${bold(skill)} → ${fsu.tildify(dest)}  ${dim(`(${fileCount} file(s) from ${src.name}@${branchUsed})`)}`);
  if (note) console.log(dim('  ' + note));
  console.log(dim(`  source: ${src.name}@${branchUsed} — branch HEAD, not a pinned commit; review before use`));
  if (scripts.length) {
    const show = scripts.slice(0, 6).join(', ') + (scripts.length > 6 ? ', …' : '');
    console.log(dim(`  ⚠ includes ${scripts.length} script file(s): ${show}`));
  }

  // usage guidance — scoped by row identity to the exact group you installed from
  const guide = chosen.row
    ? infoForRow(skill, chosen.row, data.vendors)
    : buildInfo(skill, { skillIndex: idx.skillIndex, vendors: data.vendors });
  console.log(renderInfo(guide, { en: !values.zh, all: true }));
  console.log(dim('\nStart a new Claude Code session to load the skill, then invoke it by name.'));
};
