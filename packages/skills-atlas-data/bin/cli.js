#!/usr/bin/env node
// skills-atlas <query> — search the Skills Atlas catalog from the terminal.
const data = require('../index.js');

const q = process.argv.slice(2).join(' ').toLowerCase().trim();
if (!q) {
  console.error('usage: skills-atlas <query>   e.g. skills-atlas seo');
  process.exit(1);
}

const rows = data.sections.flatMap(s =>
  s.subsections.flatMap(ss => ss.rows.map(r => ({ ...r, _cat: s.title }))));

const hits = rows.filter(r =>
  (r.group + ' ' + r.skills.join(' ') + ' ' + (r.use_case || '') + ' ' + r.description)
    .toLowerCase().includes(q));

hits.slice(0, 15).forEach(r => {
  console.log(`\n${r.chain ? '⛓ ' : ''}${r.group}   [${r._cat}]`);
  if (r.use_case) console.log(`  💡 ${r.use_case}`);
  console.log(`  skills: ${r.skills.join(', ')}`);
  const s = r.sources && r.sources[0];
  if (s && s.install) console.log(`  install: ${s.install.command}`);
});
console.log(`\n${hits.length} match(es).`);
