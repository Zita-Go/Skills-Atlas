'use strict';

const fs = require('fs');
const path = require('path');
const { parse } = require('../args');
const { loadData } = require('../data');
const { buildIndices, suggestSkills } = require('../index-build');
const { buildInfo, renderInfo, dim } = require('../format');
const fsu = require('../fsutil');
const manifest = require('../manifest');

// The authoritative one-liner: a skill's own SKILL.md `description:` frontmatter,
// read locally when installed (offline). Catalog text is group-level; this is not.
function localSkillDesc(skill) {
  for (const s of fsu.scopesFor({})) {
    try {
      const md = fs.readFileSync(path.join(s.root, skill, 'SKILL.md'), 'utf8');
      const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      const dm = fm && fm[1].match(/^description:\s*(.+)$/m);
      if (dm) return dm[1].trim().replace(/^["']|["']$/g, '');
    } catch { /* not installed in this scope */ }
  }
  return '';
}

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
  const installed = [];
  for (const s of fsu.scopesFor({})) if (manifest.list(s.root).some(e => e.skill === infoObj.skill)) installed.push(s.name);
  const skillDesc = installed.length ? localSkillDesc(infoObj.skill) : '';
  console.log(renderInfo(infoObj, { en: !values.zh, all: values.all, installed, skillDesc }));
};
