// `skills-atlas sync` — read skills-atlas.kit.json and install/upgrade the project
// to match it. Idempotent; for teammates and CI. Reuses installer + drift guard.
'use strict';

const path = require('path');
const { parse } = require('../args');
const { loadData } = require('../data');
const { buildIndices, vendorsFor, skillDocPath } = require('../index-build');
const { installFolder } = require('../installer');
const fsu = require('../fsutil');
const km = require('../kitmanifest');
const { green, dim, cyan } = require('../format');

const HELP = `usage: skills-atlas sync [options]

Read skills-atlas.kit.json and install/upgrade this project's skills to match it.

options:
  --global    sync to ~/.claude/skills/ instead of the project
  --force     overwrite skills with local edits
  --update    re-fetch every skill to latest and rewrite the manifest
  --dry-run   show what would change; write nothing
  --json      machine-readable output`;

module.exports = async function sync(argv) {
  const { values } = parse(argv, ['global', 'project', 'force', 'update', 'dry-run', 'json']);
  if (values.help) { console.log(HELP); return; }

  const projectRoot = process.cwd();
  const manifest = km.read(projectRoot);
  if (!manifest) {
    console.error(`no ${km.FILE} here. run \`skills-atlas kit\` first.`);
    process.exitCode = 1; return;
  }
  const targetRoot = fsu.installTargetDir({ global: Boolean(values.global) });

  const currentHash = name => {
    const dest = path.join(targetRoot, name);
    if (!fsu.dirExists(dest)) return null;
    try { return fsu.hashDir(dest); } catch { return null; }
  };
  const actions = km.planSync(manifest, currentHash);

  if (values['dry-run']) {
    for (const a of actions) console.log(`  ${a.action.padEnd(14)} ${a.name}`);
    console.log(dim('\n(dry run — nothing written)'));
    return;
  }

  const { data } = loadData({ quiet: values.json });
  const idx = buildIndices(data);
  const results = [];

  for (const a of actions) {
    const rec = { name: a.name, action: a.action };
    if (a.action === 'up-to-date' && !values.update) { results.push({ ...rec, status: 'up-to-date' }); continue; }
    if (a.action === 'local-changes' && !values.force) { results.push({ ...rec, status: 'local-changes' }); continue; }

    const chosen = vendorsFor(idx.skillIndex, a.name).find(c => c.source.name === a.declared.source)
      || vendorsFor(idx.skillIndex, a.name)[0];
    const docPath = chosen && skillDocPath(chosen.vendor, a.name);
    if (!docPath) { results.push({ ...rec, status: 'no-folder' }); continue; }

    const v = chosen.vendor, src = chosen.source;
    const dest = path.join(targetRoot, a.name);
    try {
      const r = await installFolder({
        author: v.author || src.author, repo: v.repo || src.repo,
        branch: a.declared.ref || v.default_branch || src.default_branch || 'main',
        docPath, dest, targetRoot, skillName: a.name,
        source: src.name, group: chosen.row && chosen.row.group, category: chosen.row && chosen.row._cat,
      });
      results.push({ ...rec, status: 'installed', hash: r.hash });
      if (values.update) { a.declared.hash = r.hash; a.declared.ref = r.branchUsed; a.declared.source = src.name; }
    } catch (e) {
      results.push({ ...rec, status: 'failed', error: e.message });
    }
  }

  if (values.update) km.write(projectRoot, manifest);
  if (results.some(r => r.status === 'failed')) process.exitCode = 1; // CI-visible failure

  if (values.json) { console.log(JSON.stringify(results, null, 2)); return; }
  for (const r of results) {
    const sym = r.status === 'installed' ? green('✓') : r.status === 'up-to-date' ? dim('=') : r.status === 'local-changes' ? '✋' : '✗';
    console.log(`  ${sym} ${r.name}  ${dim(r.status + (r.error ? ': ' + r.error : ''))}`);
  }
  const n = results.filter(r => r.status === 'installed').length;
  console.log(`\n${n} installed/updated from ${cyan(km.FILE)}.`);
  if (results.some(r => r.status === 'local-changes')) console.log(dim('skipped local edits — re-run with --force.'));
};
