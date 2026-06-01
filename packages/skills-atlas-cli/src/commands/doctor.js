'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('../args');
const { loadData } = require('../data');
const { buildIndices, rowsFor } = require('../index-build');
const fsu = require('../fsutil');
const manifest = require('../manifest');
const { dim, yellow, green } = require('../format');

const RISKY_LICENSE = /\bNC\b|GPL|AGPL|Commons[- ]?Clause/i;

module.exports = async function doctor(argv) {
  const { values } = parse(argv, ['global', 'project', 'json']);
  if (values.help) { console.log('usage: skills-atlas doctor [--global|--project] [--json]'); return; }

  const { data } = loadData({ quiet: values.json });
  const idx = buildIndices(data);
  const findings = [];
  const seen = {}; // skill -> [scopes]

  for (const s of fsu.scopesFor(values)) {
    const root = s.root;
    const m = manifest.read(root);

    let folders = [];
    try {
      folders = fs.readdirSync(root, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);
    } catch { /* no skills dir yet */ }

    for (const [skill, e] of Object.entries(m.skills)) {
      seen[skill] = (seen[skill] || []).concat(s.name);
      const dir = path.join(root, skill);
      if (!fsu.dirExists(dir)) { findings.push({ scope: s.name, skill, level: 'warn', msg: 'recorded but folder missing on disk' }); continue; }
      if (!fs.existsSync(path.join(dir, 'SKILL.md'))) findings.push({ scope: s.name, skill, level: 'error', msg: 'no SKILL.md in folder' });
      if (!data.vendors[e.source] || !rowsFor(idx.skillIndex, skill).length) findings.push({ scope: s.name, skill, level: 'info', msg: 'no longer in the catalog' });
      if (e.scripts) findings.push({ scope: s.name, skill, level: 'info', msg: `ships ${e.scripts} script file(s) — review` });
      const vendor = data.vendors[e.source];
      if (vendor && vendor.license && RISKY_LICENSE.test(vendor.license)) findings.push({ scope: s.name, skill, level: 'warn', msg: `license: ${vendor.license}` });
    }

    for (const f of folders) {
      if (!m.skills[f]) findings.push({ scope: s.name, skill: f, level: 'info', msg: 'folder not tracked by skills-atlas' });
    }
  }

  for (const [skill, scopes] of Object.entries(seen)) {
    if (scopes.length > 1) findings.push({ scope: scopes.join('+'), skill, level: 'warn', msg: 'installed in both scopes (project shadows global)' });
  }

  if (values.json) { console.log(JSON.stringify(findings, null, 2)); return; }
  if (!findings.length) { console.log(`${green('✓')} all good — no issues found.`); return; }

  const order = { error: 0, warn: 1, info: 2 };
  findings.sort((a, b) => order[a.level] - order[b.level]);
  for (const f of findings) {
    const tag = f.level === 'error' ? '✗' : f.level === 'warn' ? yellow('!') : dim('·');
    console.log(`  ${tag} ${f.skill} ${dim(`[${f.scope}]`)}  ${f.msg}`);
  }
  const e = findings.filter(f => f.level === 'error').length;
  const w = findings.filter(f => f.level === 'warn').length;
  console.log(`\n${e} error(s), ${w} warning(s), ${findings.length - e - w} note(s).`);
};
