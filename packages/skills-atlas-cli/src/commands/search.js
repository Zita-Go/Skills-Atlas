'use strict';

const { parse } = require('../args');
const { loadData } = require('../data');
const { buildIndices, suggestSkills } = require('../index-build');
const { runSearch } = require('../search-core');
const { renderRow, dim } = require('../format');

const HELP = `usage: skills-atlas search <query...> [filters]

Matches by words, not whole-string: multiple keywords and loose phrases work
(e.g. "pdf 翻译", "translate a whole pdf"). Ranked by how much of the query hits.

filters:
  -c, --category <s>   match a top-level category (loose, zh or en)
  -p, --persona <s>    match a persona — English or Chinese, e.g.
                       engineering, pm, design, marketing, research, ops,
                       founder, job-seeking, general (工程/PM/设计/营销/...)
  -t, --type <s>       match a source type (skill/plugin/marketplace/...)
      --chain          only ⛓ strong-binding workflow chains
      --limit <n>      max results (default 15)
      --json           machine-readable output
      --zh             中文输出 (output is English by default)`;

function jsonRow(r) {
  return {
    group: r.group, group_en: r.group_en, category: r._cat, chain: r.chain,
    skills: r.skills, use_case: r.use_case, when_to_use: r.when_to_use,
    personas: r.personas || [],
    sources: (r.sources || []).map(s => ({
      id: s.name, stars: s.stars, type: s.type,
      install: s.install ? s.install.command : null,
    })),
  };
}

module.exports = async function search(argv) {
  const { values, positionals } = parse(argv, ['category', 'persona', 'type', 'chain', 'limit', 'json']);
  if (values.help) { console.log(HELP); return; }

  const query = positionals.join(' ').trim();
  const hasFilter = values.category || values.persona || values.type || values.chain;
  if (!query && !hasFilter) {
    console.error('usage: skills-atlas search <query...> [-c category] [-p persona] [-t type] [--chain]');
    process.exitCode = 1;
    return;
  }

  const en = !values.zh; // English by default; --zh for Chinese
  const { data } = loadData({ quiet: values.json });
  const { flatRows } = buildIndices(data);

  const { rows, weak } = runSearch(flatRows, {
    query,
    category: values.category,
    persona: values.persona,
    type: values.type,
    chain: values.chain,
  });

  const limit = Math.max(1, parseInt(values.limit || '15', 10) || 15);
  const shown = rows.slice(0, limit);

  if (values.json) {
    console.log(JSON.stringify(shown.map(jsonRow), null, 2));
    return;
  }

  // No matches → suggest nearest skill names instead of a bare count.
  if (rows.length === 0) {
    console.log('\n0 matches.');
    if (query) {
      const { skillIndex } = buildIndices(data);
      const sugg = suggestSkills(skillIndex, query);
      if (sugg.length) console.log(dim(`did you mean: ${sugg.join(', ')}`));
      console.log(dim('try fewer / different words, or `skills-atlas categories` to browse.'));
    }
    return;
  }

  if (weak) {
    console.log(dim('\n⚠ weak matches — none of the results cover your whole query; try different words.'));
  }
  shown.forEach(r => console.log(renderRow(r, { en })));
  const more = rows.length > limit ? `, showing ${limit}` : '';
  console.log(`\n${rows.length} match(es)${more}.`);
};
