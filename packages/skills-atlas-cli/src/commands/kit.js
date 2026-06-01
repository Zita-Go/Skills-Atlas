// `skills-atlas kit` — detect the project's archetype(s), propose a curated skill
// kit (core dev workflow + add-ons), install to project scope after confirmation,
// and write a committable skills-atlas.kit.json. Reuses installer/manifest/index.
'use strict';

const path = require('path');
const { parse } = require('../args');
const { loadData } = require('../data');
const { buildIndices, vendorsFor, skillDocPath } = require('../index-build');
const { installFolder } = require('../installer');
const fsu = require('../fsutil');
const km = require('../kitmanifest');
const { detect } = require('../detect');
const { buildKitPlan, ARCHETYPE_NAMES } = require('../kits');
const { confirm } = require('../prompt');
const { bold, dim, green, cyan } = require('../format');

const HELP = `usage: skills-atlas kit [options]

Detect this project's type, propose a curated skill kit, install it to
./.claude/skills/, and write a committable skills-atlas.kit.json.

options:
  --archetype <name>  override detection (${ARCHETYPE_NAMES.join(', ')})
  --global            install to ~/.claude/skills/ instead of the project
  --yes               install the proposed kit without prompting
  --dry-run           show the proposed kit; write nothing
  --json              machine-readable output`;

module.exports = async function kit(argv) {
  const { values } = parse(argv, ['global', 'project', 'yes', 'dry-run', 'json', 'archetype']);
  if (values.help) { console.log(HELP); return; }

  const projectRoot = process.cwd();
  const global = Boolean(values.global);            // kit defaults to PROJECT scope
  const targetRoot = fsu.installTargetDir({ global });

  // 1. detect (or honor --archetype)
  let archetypes, signals;
  if (values.archetype) {
    if (!ARCHETYPE_NAMES.includes(values.archetype)) {
      console.error(`unknown archetype '${values.archetype}'. known: ${ARCHETYPE_NAMES.join(', ')}`);
      process.exitCode = 1; return;
    }
    archetypes = [values.archetype]; signals = [`--archetype ${values.archetype}`];
  } else {
    ({ archetypes, signals } = detect(projectRoot));
  }

  // 2. resolve catalog + currently-installed set, build the plan
  const { data } = loadData({ quiet: values.json });
  const idx = buildIndices(data);
  const installed = new Set(require('../manifest').list(targetRoot).map(e => e.skill));
  const plan = buildKitPlan(archetypes, installed);

  // resolve each skill to an installable source (skip ones with no folder)
  const items = [];
  for (const s of plan.skills) {
    const chosen = vendorsFor(idx.skillIndex, s.name)[0];
    const docPath = chosen && skillDocPath(chosen.vendor, s.name);
    items.push({ ...s, chosen, docPath, installable: Boolean(docPath) });
  }
  const installable = items.filter(i => i.installable && !i.installed);

  // human proposal (machine mode prints one JSON object at the end instead)
  if (!values.json) {
    console.log(`\nDetected: ${bold(archetypes.join(' + '))}  ${dim(signals.join('; '))}`);
    console.log(`Proposed kit — ${installable.length} new skill(s) → ${fsu.tildify(targetRoot)}\n`);
    let group = null;
    for (const i of items) {
      if (i.group !== group) { group = i.group; console.log(`  ${group === 'core' ? 'core dev workflow' : group}`); }
      const mark = i.installed ? dim('✓ installed') : i.installable ? '' : dim('(whole-repo only — skipped)');
      console.log(`    • ${i.name.padEnd(26)} ${dim(i.reason)} ${mark}`);
    }
  }
  const proposal = { archetypes, scope: global ? 'global' : 'project',
    skills: items.map(i => ({ name: i.name, group: i.group, installed: i.installed, installable: i.installable })) };

  if (values['dry-run']) {
    if (values.json) console.log(JSON.stringify(proposal, null, 2));
    else console.log(dim('\n(dry run — nothing written)'));
    return;
  }
  if (!installable.length) {
    if (values.json) console.log(JSON.stringify({ ...proposal, manifest: null, installedNow: [], failed: [] }, null, 2));
    else console.log(green('\n✓ nothing to install — kit already satisfied.'));
    return;
  }

  if (!values.yes && !values.json) {
    const ok = await confirm(`\nInstall ${installable.length} skill(s) and write ${km.FILE}?`, true);
    if (!ok) { console.log('aborted.'); return; }
  }

  // 3. install (best-effort, like the chain installer)
  const recorded = [];
  const installedNow = [], failed = [];
  for (const i of installable) {
    const v = i.chosen.vendor, src = i.chosen.source;
    const dest = path.join(targetRoot, i.name);
    try {
      const r = await installFolder({
        author: v.author || src.author, repo: v.repo || src.repo,
        branch: v.default_branch || src.default_branch || 'main',
        docPath: i.docPath, dest, targetRoot, skillName: i.name,
        source: src.name, group: i.chosen.row && i.chosen.row.group, category: i.chosen.row && i.chosen.row._cat,
      });
      if (!values.json) console.log(`  ${green('✓')} ${i.name} ${dim(`(${r.fileCount} files)`)}`);
      recorded.push({ name: i.name, source: src.name, ref: r.branchUsed, hash: r.hash, group: i.group });
      installedNow.push(i.name);
    } catch (e) {
      if (!values.json) console.log(`  ${dim('✗ ' + i.name + ' — ' + e.message)}`);
      failed.push({ name: i.name, error: e.message });
    }
  }

  // include already-installed kit members in the manifest too (so it's complete)
  for (const i of items.filter(x => x.installed)) {
    const rec = require('../manifest').read(targetRoot).skills[i.name] || {};
    recorded.push({ name: i.name, source: rec.source || null, ref: rec.branch || null, hash: rec.hash || null, group: i.group });
  }

  // 4. write the committable kit manifest
  const manifest = { version: 1, archetypes, scope: global ? 'global' : 'project', skills: recorded };
  km.write(projectRoot, manifest);
  if (failed.length) process.exitCode = 1; // surface partial/total install failure to callers/CI

  if (values.json) {
    console.log(JSON.stringify({ ...proposal, manifest: km.FILE, installedNow, failed }, null, 2));
  } else {
    console.log(`\n${green('✓')} kit ready — ${recorded.length} skill(s); wrote ${cyan(km.FILE)}`);
    if (failed.length) console.log(dim(`  ${failed.length} failed to install — see above.`));
    console.log(dim(`  teammates can reproduce it with: skills-atlas sync`));
    console.log(dim('  start a new Claude Code session to load the skills.'));
  }
};
