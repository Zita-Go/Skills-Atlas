'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('../args');

const readSkillMd = dest => {
  try { return fs.readFileSync(path.join(dest, 'SKILL.md'), 'utf8'); } catch { return null; }
};
const { loadData } = require('../data');
const { buildIndices, vendorsFor, suggestSkills, skillDocPath } = require('../index-build');
const { listSkillFiles } = require('../github');
const fsu = require('../fsutil');
const { installFolder } = require('../installer');
const { confirm, choose } = require('../prompt');
const { buildInfo, infoForRow, renderInfo, bold, dim, cyan, green, stars, safeAlt } = require('../format');

const HELP = `usage: skills-atlas install <skill> [options]

options:
  -g, --global       install to ~/.claude/skills/   (default)
      --project      install to ./.claude/skills/
  -s, --source <id>  pick a source when a skill has several
  -f, --force        overwrite if already installed
  -y, --yes          non-interactive (auto-pick top source, assume yes)
      --chain        install the whole ⛓ workflow this skill belongs to
      --dry-run      show what would download, write nothing
      --verbose      with \`use\`: also print the full SKILL.md to the terminal
      --json         machine-readable output

Downloads the repo archive (no GitHub API rate limit). Only if that fetch fails
does it fall back to the GitHub API (60/h unauthenticated) — set GITHUB_TOKEN to
raise that fallback to 5000/h.`;

function resolveGlobal(values) {
  if (values.project) return false;
  if (values.global) return true;
  return true; // default: global
}

// Install every installable skill in a chain (workflow). One archive download
// serves them all (github archive cache).
async function installChain({ row, vendor, src, targetRoot, values }) {
  const author = vendor.author || src.author;
  const repo = vendor.repo || src.repo;
  const branch = vendor.default_branch || src.default_branch || 'main';

  const items = [], skipped = [];
  for (const sk of row.skills || []) {
    const dp = skillDocPath(vendor, sk);
    if (dp) items.push({ name: sk, docPath: dp }); else skipped.push(sk);
  }
  if (!items.length) {
    console.error(`no installable skills in this chain from ${src.name}.`);
    process.exitCode = 1;
    return;
  }

  if (!values.json) console.log(`\ninstalling ${items.length}-skill chain from ${bold(src.name)}: ${dim(items.map(i => i.name).join(' → '))}`);
  const installed = [], failed = [];
  for (const it of items) {
    const dest = path.join(targetRoot, it.name);
    if (fsu.dirExists(dest) && !values.force) {
      if (!values.json) console.log(dim(`  • ${it.name} — already installed (use --force to overwrite)`));
      installed.push(it.name);
      continue;
    }
    try {
      const r = await installFolder({ author, repo, branch, docPath: it.docPath, dest, targetRoot, skillName: it.name, source: src.name, group: row && row.group, category: row && row._cat });
      if (!values.json) console.log(`  ${green('✓')} ${it.name}  ${dim(`(${r.fileCount} files)`)}`);
      installed.push(it.name);
    } catch (e) {
      if (!values.json) console.log(dim(`  ✗ ${it.name} — ${e.message}`));
      failed.push(it.name);
    }
  }

  if (values.json) {
    console.log(JSON.stringify({ mode: 'chain', group: row.group, dest: targetRoot, installed, failed, skipped }));
    return;
  }
  if (skipped.length) console.log(dim(`  (skipped ${skipped.length}: ${skipped.join(', ')} — no per-skill folder)`));
  console.log(`\n${green('✓')} chain ready — ${installed.length} skill(s) in ${fsu.tildify(targetRoot)}`);
  console.log(dim(`  run in order: ${(row.skills || []).join(' → ')}`));
  console.log(dim('\nStart a new Claude Code session to load them, then run the workflow in order.'));
}

module.exports = async function install(argv) {
  const { values, positionals } = parse(argv,
    ['global', 'project', 'source', 'force', 'yes', 'chain', 'inline', 'dry-run', 'verbose', 'json']);
  if (values.help) { console.log(HELP); return; }

  const name = positionals[0];
  if (!name) {
    console.error('usage: skills-atlas install <skill> [--global|--project] [--source <id>] [--force] [--yes]');
    console.error(dim('find a skill first: skills-atlas search <keyword>'));
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
      // Non-interactive without a pick: show each source so the user can decide
      // (stars / type / install command), instead of just listing bare names.
      console.error(`'${name}' has ${candidates.length} sources — pick one with --source <id>, or --yes to auto-pick the top:`);
      candidates.forEach(c => console.error(dim(
        `  ${c.source.name}  ${stars(c.source.stars)}  ${c.source.type || ''}` +
        `${(c.source.install && c.source.install.command) ? '  → ' + c.source.install.command : ''}`)));
      process.exitCode = 2;
      return;
    }
    chosen = candidates[i];
  }

  // Heads-up whenever --yes auto-picked among several sources — say which one and
  // what else was available, so a silent pick of a lower-star (but installable)
  // source over a higher-star whole-repo one is never a surprise.
  if (values.yes && candidates.length > 1 && !values.json) {
    const st = stars(chosen.source.stars);
    const grp = chosen.row && chosen.row.group;
    const others = candidates.filter(c => c !== chosen).map(c => c.source.name).join(', ');
    console.error(dim(`note: '${name}' has ${candidates.length} sources; auto-picked ${chosen.source.name}${st ? ' ' + st : ''}${grp ? ` (${grp})` : ''}. also from: ${others} — use --source <id> to choose.`));
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
  // Global installs read best as ~/…; a --project path is shorter and clearer as a
  // relative ./.claude/skills/<skill> than a long absolute path.
  const showPath = pth => resolveGlobal(values) ? fsu.tildify(pth) : './' + path.relative(process.cwd(), pth);
  const isChain = Boolean(chosen.row && chosen.row.chain && (chosen.row.skills || []).length >= 2);

  // --- chain: install the whole workflow ---
  if (values.chain) {
    if (!isChain) {
      console.log(dim(`'${skill}' isn't part of a multi-skill chain; installing it alone.`));
    } else if (values['dry-run']) {
      console.log(`would install the ${chosen.row.skills.length}-skill chain: ${chosen.row.skills.join(' → ')}`);
      return;
    } else {
      await installChain({ row: chosen.row, vendor: v, src, targetRoot, values });
      return;
    }
  }

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
    console.log(`would install ${listing.files.length} file(s) to ${showPath(dest)} (branch ${listing.branchUsed}):`);
    listing.files.forEach(f => console.log(`  ${f.rel}`));
    if (listing.note) console.log(dim('  ' + listing.note));
    console.log(dim('  (real install fetches the repo archive — no GitHub API rate limit)'));
    return;
  }

  // --- single skill: download (archive → API fallback), record, report ---
  let result;
  try {
    result = await installFolder({ author, repo, branch, docPath, dest, targetRoot, skillName: skill, source: src.name, group: chosen.row && chosen.row.group, category: chosen.row && chosen.row._cat });
  } catch (e) {
    console.error(`install failed: ${e.message}`);
    process.exitCode = 1;
    return;
  }

  // learn: installing clears any prior suppression (you changed your mind about it).
  try { require('../feedback').record({ skill, signal: 'accepted' }); } catch { /* ignore */ }

  if (values.json) {
    const out = {
      skill, mode: 'folder', source: src.name,
      dest: result.dest, files: result.fileCount, scripts: result.scripts.length, branch: result.branchUsed,
    };
    if (values.inline) out.skillMd = readSkillMd(result.dest);
    console.log(JSON.stringify(out));
    return;
  }

  console.log(`\n${green('✓')} installed ${bold(skill)} → ${showPath(result.dest)}  ${dim(`(${result.fileCount} file(s) from ${src.name}@${result.branchUsed})`)}`);
  if (result.note) console.log(dim('  ' + result.note));
  console.log(dim(`  source: ${src.name}@${result.branchUsed} — branch HEAD, not a pinned commit; review before use`));
  if (result.scripts.length) {
    const show = result.scripts.slice(0, 6).join(', ') + (result.scripts.length > 6 ? ', …' : '');
    console.log(dim(`  ⚠ includes ${result.scripts.length} script file(s): ${show}`));
  }
  if (isChain) {
    console.log(dim(`  ⛓ part of a ${chosen.row.skills.length}-skill workflow — install all: skills-atlas install ${skill} --chain`));
  }

  // usage guidance — scoped by row identity to the exact group you installed from
  const guide = chosen.row
    ? infoForRow(skill, chosen.row, data.vendors)
    : buildInfo(skill, { skillIndex: idx.skillIndex, vendors: data.vendors });
  console.log(renderInfo(guide, { en: !values.zh, all: true }));

  if (values.inline) {
    const body = readSkillMd(result.dest);
    const mdPath = showPath(path.join(result.dest, 'SKILL.md'));
    // Claude (and any piped caller) needs the full SKILL.md inline to apply the
    // skill right now; a human at a terminal just needs the digest — the file is
    // on disk and auto-loads, so dumping ~200 lines would only bury the next step.
    const full = body && (values.verbose || !process.stdout.isTTY);
    if (full) {
      console.log('\n' + dim('─── SKILL.md — the skill\'s own instructions; apply them to the task now ───'));
      console.log(body.trim());
      console.log(dim('─── end SKILL.md ───'));
    }
    console.log(`\n${green('✓')} ${bold(skill)} is now active — ${full ? 'use the instructions above' : 'follow its SKILL.md'} for the task at hand.`);
    console.log(dim(`  installed at ${showPath(result.dest)} (auto-loads in new sessions) · what it does: skills-atlas info ${skill} · remove: skills-atlas remove ${skill}`));
    if (body && !full) console.log(dim(`  full instructions: ${mdPath}  (or re-run with --verbose)`));
  } else {
    console.log(`\n${bold(skill)} is installed but not loaded yet. To use it:`);
    console.log(dim(`  • now, in this session:  skills-atlas use ${skill}`));
    console.log(dim('  • or start a new Claude Code session — it auto-loads from ~/.claude/skills/'));
    console.log(dim(`  what it does: skills-atlas info ${skill} · remove: skills-atlas remove ${skill}`));
  }
};
