'use strict';

const path = require('path');
const { parse } = require('../args');
const { loadData } = require('../data');
const { buildIndices, vendorsFor, skillDocPath } = require('../index-build');
const { installFolder } = require('../installer');
const fsu = require('../fsutil');
const manifest = require('../manifest');
const { green, dim } = require('../format');

module.exports = async function upgrade(argv) {
  const { values, positionals } = parse(argv, ['global', 'project', 'all', 'force', 'json']);
  if (values.help) {
    console.log('usage: skills-atlas upgrade [<skill> | --all] [--global|--project] [--force]\n\n' +
      'Re-fetch installed skills to the latest. Refuses to overwrite a folder you\n' +
      'have edited locally (or one installed before change-tracking) unless --force.');
    return;
  }
  if (!values.all && !positionals[0]) {
    console.error('usage: skills-atlas upgrade <skill> | --all');
    process.exitCode = 1;
    return;
  }

  // Collect (scope, skill) targets across the selected scopes (default: both),
  // so `outdated` (both scopes) → `upgrade --all` covers the same skills.
  const targets = [];
  for (const s of fsu.scopesFor(values)) {
    const m = manifest.read(s.root);
    const names = values.all ? Object.keys(m.skills) : (m.skills[positionals[0]] ? [positionals[0]] : []);
    for (const n of names) targets.push({ scope: s, name: n, entry: m.skills[n] });
  }
  if (!targets.length) {
    if (values.json) { console.log('[]'); if (positionals[0]) process.exitCode = 1; return; }
    if (positionals[0]) {
      // A named skill that isn't installed is a user error → non-zero, like `remove`.
      console.log(`'${positionals[0]}' is not installed by skills-atlas.`);
      console.log(dim('see what is: skills-atlas installed'));
      process.exitCode = 1;
    } else {
      console.log('nothing installed to upgrade.');
    }
    return;
  }

  const { data } = loadData({ quiet: values.json });
  const idx = buildIndices(data);
  const results = [];

  for (const { scope, name, entry } of targets) {
    const root = scope.root;
    const rec = { skill: name, scope: scope.name };

    const chosen = vendorsFor(idx.skillIndex, name).find(c => c.source.name === entry.source)
      || vendorsFor(idx.skillIndex, name)[0];
    if (!chosen) { results.push({ ...rec, status: 'not-in-catalog' }); continue; }

    const v = chosen.vendor, src = chosen.source;
    const docPath = skillDocPath(v, name);
    if (!docPath) { results.push({ ...rec, status: 'no-folder' }); continue; }

    const dest = path.join(root, name);
    // drift guard — never clobber edits, and never clobber a folder of unknown
    // provenance (installed before hashes existed) without --force.
    if (fsu.dirExists(dest) && !values.force) {
      if (!entry.hash) { results.push({ ...rec, status: 'no-baseline' }); continue; }
      let cur = null;
      try { cur = fsu.hashDir(dest); } catch { /* unreadable → fall through */ }
      if (cur && cur !== entry.hash) { results.push({ ...rec, status: 'local-changes' }); continue; }
    }

    try {
      const r = await installFolder({
        author: v.author || src.author, repo: v.repo || src.repo,
        branch: v.default_branch || src.default_branch || 'main',
        docPath, dest, targetRoot: root, skillName: name,
        source: src.name, group: chosen.row && chosen.row.group, category: chosen.row && chosen.row._cat,
      });
      results.push({ ...rec, status: (entry.hash && r.hash === entry.hash) ? 'up-to-date' : 'upgraded', files: r.fileCount });
    } catch (e) {
      results.push({ ...rec, status: 'failed', error: e.message });
    }
  }

  if (values.json) { console.log(JSON.stringify(results, null, 2)); return; }
  for (const r of results) {
    const sym = r.status === 'upgraded' ? green('✓')
      : r.status === 'up-to-date' ? dim('=')
        : (r.status === 'local-changes' || r.status === 'no-baseline') ? '✋' : '✗';
    console.log(`  ${sym} ${r.skill} ${dim(`[${r.scope}]`)}  ${dim(r.status + (r.error ? ': ' + r.error : ''))}`);
  }
  const up = results.filter(r => r.status === 'upgraded').length;
  console.log(`\n${up} upgraded.`);
  if (results.some(r => r.status === 'local-changes' || r.status === 'no-baseline')) {
    console.log(dim('skipped some (local edits, or installed before change-tracking) — re-run with --force.'));
  }
};
