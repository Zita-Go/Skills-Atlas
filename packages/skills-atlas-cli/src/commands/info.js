'use strict';

const { parse } = require('../args');
const { loadData } = require('../data');
const { buildIndices, suggestSkills } = require('../index-build');
const { buildInfo, renderInfo, dim } = require('../format');

const HELP = `usage: skills-atlas info <skill> [--all] [--json] [--zh]

Show a skill's description, use case, when-to-use, personas, source repo(s)
(stars / license / type), the in-repo SKILL.md path, and the install command.
Leads with the most relevant group; --all expands same-named skills in others.`;

module.exports = async function info(argv) {
  const { values, positionals } = parse(argv, ['json', 'all']);
  if (values.help) { console.log(HELP); return; }

  const name = positionals[0];
  if (!name) {
    console.error('usage: skills-atlas info <skill>');
    console.error(dim('find a skill name first: skills-atlas search <keyword>'));
    process.exitCode = 1;
    return;
  }

  const { data } = loadData({ quiet: values.json });
  const { skillIndex } = buildIndices(data);
  const infoObj = buildInfo(name, { skillIndex, vendors: data.vendors });

  if (!infoObj.found) {
    if (values.json) {
      console.log(JSON.stringify(infoObj, null, 2));
    } else {
      const sugg = suggestSkills(skillIndex, name);
      console.error(`skill '${name}' not found.`);
      if (sugg.length) console.error(`did you mean: ${sugg.join(', ')}`);
      console.error(`try: skills-atlas search ${name}`);
    }
    process.exitCode = 1;
    return;
  }

  if (values.json) {
    console.log(JSON.stringify(infoObj, null, 2));
    return;
  }
  console.log(renderInfo(infoObj, { en: !values.zh, all: values.all }));
};
