'use strict';

const { parse } = require('../args');
const { loadData } = require('../data');
const fsu = require('../fsutil');
const manifest = require('../manifest');
const { cyan, dim, yellow } = require('../format');

const day = s => (s ? String(s).slice(0, 10) : null);

module.exports = async function outdated(argv) {
  const { values } = parse(argv, ['global', 'project', 'json']);
  if (values.help) { console.log('usage: skills-atlas outdated [--global|--project] [--json]'); return; }

  const { data } = loadData({ quiet: values.json });
  const report = [];
  for (const s of fsu.scopesFor(values)) {
    for (const e of manifest.list(s.root)) {
      const vendor = data.vendors[e.source];
      let status, latest = null;
      if (!vendor) {
        status = 'not-in-catalog';
      } else {
        latest = vendor.last_commit || null;
        const inst = day(e.installedAt);
        status = (latest && inst && day(latest) > inst) ? 'outdated' : 'up-to-date';
      }
      report.push({ scope: s.name, skill: e.skill, source: e.source, installed: day(e.installedAt), latest, status });
    }
  }

  if (values.json) { console.log(JSON.stringify(report, null, 2)); return; }
  if (!report.length) { console.log('no skills installed by skills-atlas.'); return; }

  for (const r of report) {
    const tag = r.status === 'outdated' ? yellow('outdated')
      : r.status === 'not-in-catalog' ? dim('not in catalog') : dim('up to date');
    console.log(`  ${cyan(r.skill)} ${dim(`[${r.scope}]`)}  inst ${r.installed || '?'} · ${r.source || '?'}@${r.latest || '?'}  ${tag}`);
  }
  const n = report.filter(r => r.status === 'outdated').length;
  const orphan = report.filter(r => r.status === 'not-in-catalog').length;
  console.log(`\n${n} outdated${orphan ? `, ${orphan} not in catalog` : ''}.`);
  if (n) console.log(dim('upgrade: skills-atlas upgrade --all   (or upgrade <skill>)'));
};
