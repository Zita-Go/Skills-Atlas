'use strict';

const { parse } = require('../args');
const fsu = require('../fsutil');
const manifest = require('../manifest');
const { bold, dim, cyan } = require('../format');

const HELP = `usage: skills-atlas installed [--global|--project] [--json]

List skills installed by skills-atlas (from the per-target manifest).
Default: both global (~/.claude/skills) and project (./.claude/skills).`;

module.exports = async function installed(argv) {
  const { values } = parse(argv, ['global', 'project', 'json']);
  if (values.help) { console.log(HELP); return; }

  const scopes = [];
  if (values.project && !values.global) {
    scopes.push({ name: 'project', root: fsu.installTargetDir({ global: false }) });
  } else if (values.global && !values.project) {
    scopes.push({ name: 'global', root: fsu.installTargetDir({ global: true }) });
  } else {
    scopes.push({ name: 'global', root: fsu.installTargetDir({ global: true }) });
    scopes.push({ name: 'project', root: fsu.installTargetDir({ global: false }) });
  }

  const out = scopes.map(s => ({ scope: s.name, root: s.root, skills: manifest.list(s.root) }));

  if (values.json) { console.log(JSON.stringify(out, null, 2)); return; }

  let total = 0;
  for (const s of out) {
    if (!s.skills.length) continue;
    console.log(`\n${bold(s.scope)}  ${dim(fsu.tildify(s.root))}`);
    for (const e of s.skills.slice().sort((a, b) => a.skill.localeCompare(b.skill))) {
      total++;
      const when = e.installedAt ? e.installedAt.slice(0, 10) : '';
      const meta = [`${e.source || '?'}@${e.branch || '?'}`, e.group, when].filter(Boolean).join(' · ');
      console.log(`  ${cyan(e.skill)}  ${dim(meta)}`);
    }
  }
  if (!total) {
    console.log('no skills installed by skills-atlas yet.');
    console.log(dim('find one: skills-atlas search <query>  →  skills-atlas install <skill>'));
  }
};
