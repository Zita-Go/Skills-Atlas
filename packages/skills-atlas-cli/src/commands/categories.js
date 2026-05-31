'use strict';

const { parse } = require('../args');
const { loadData } = require('../data');
const { bold, dim, cyan } = require('../format');

const loose = (hay, needle) =>
  String(hay || '').toLowerCase().includes(String(needle).toLowerCase());

async function categories(argv) {
  const { values } = parse(argv, ['json']);
  if (values.help) { console.log('usage: skills-atlas categories [--json] [--en]'); return; }

  const en = Boolean(values.en);
  const { data } = loadData({ quiet: values.json });
  const cats = data.sections.map(s => ({
    title: en ? (s.title_en || s.title) : s.title,
    icon: s.icon || '',
    subgroups: s.subsections.length,
    groups: s.subsections.reduce((n, ss) => n + ss.rows.length, 0),
  }));

  if (values.json) { console.log(JSON.stringify(cats, null, 2)); return; }
  cats.forEach(c =>
    console.log(`${c.icon} ${bold(c.title)}  ${dim(`(${c.subgroups} subgroups, ${c.groups} groups)`)}`));
}

async function list(argv) {
  const { values, positionals } = parse(argv, ['category', 'json']);
  if (values.help) { console.log('usage: skills-atlas list [category] [--json] [--en]'); return; }

  const en = Boolean(values.en);
  const filter = (positionals.join(' ') || values.category || '').trim();
  const { data } = loadData({ quiet: values.json });

  const out = [];
  for (const s of data.sections) {
    if (filter && !(loose(s.title, filter) || loose(s.title_en, filter))) continue;
    out.push({
      section: en ? (s.title_en || s.title) : s.title,
      groups: s.subsections.flatMap(ss => ss.rows.map(r => ({
        group: en ? (r.group_en || r.group) : r.group,
        skills: r.skills,
        chain: r.chain,
      }))),
    });
  }

  if (values.json) { console.log(JSON.stringify(out, null, 2)); return; }
  if (!out.length) {
    console.error(`no category matching '${filter}'. run: skills-atlas categories`);
    process.exitCode = 1;
    return;
  }
  for (const sec of out) {
    console.log(`\n${bold(sec.section)}`);
    for (const g of sec.groups) {
      console.log(`  ${g.chain ? cyan('⛓ ') : ''}${g.group}  ${dim(g.skills.join(', '))}`);
    }
  }
}

module.exports = { categories, list };
