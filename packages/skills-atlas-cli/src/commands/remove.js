'use strict';

const path = require('path');
const { parse } = require('../args');
const fsu = require('../fsutil');
const manifest = require('../manifest');
const { confirm } = require('../prompt');
const { green, dim } = require('../format');

module.exports = async function remove(argv) {
  const { values, positionals } = parse(argv, ['global', 'project', 'yes', 'json']);
  if (values.help) { console.log('usage: skills-atlas remove <skill> [--global|--project] [--yes]'); return; }

  const name = positionals[0];
  if (!name) { console.error('usage: skills-atlas remove <skill>'); process.exitCode = 1; return; }

  const global = !values.project;
  const root = fsu.installTargetDir({ global });
  const dest = path.join(root, name);
  const tracked = manifest.read(root).skills[name];

  // Is the skill also present in the OTHER scope? (remove only touches one scope.)
  const otherRoot = fsu.installTargetDir({ global: !global });
  const otherFlag = global ? '--project' : '--global';
  const otherHas = otherRoot !== root
    && (fsu.dirExists(path.join(otherRoot, name)) || !!manifest.read(otherRoot).skills[name]);

  if (!fsu.dirExists(dest) && !tracked) {
    console.error(`'${name}' is not installed (${global ? 'global' : 'project'}).`);
    if (otherHas) console.error(dim(`it is installed in the ${global ? 'project' : 'global'} scope — try: skills-atlas remove ${name} ${otherFlag}`));
    process.exitCode = 1;
    return;
  }

  if (!values.yes && !values.json) {
    const ok = await confirm(`remove ${fsu.tildify(dest)}?`, false);
    if (!ok) { console.log('aborted.'); return; }
  }

  if (fsu.dirExists(dest)) fsu.rmrf(dest);
  manifest.remove(root, name);

  // NB: removal is deliberately NOT a feedback signal — cleaning up a finished
  // project's skills must not bury something you may want again. Only an explicit
  // `feedback dismiss` suppresses.

  if (values.json) { console.log(JSON.stringify({ removed: name, dest })); return; }
  console.log(`${green('✓')} removed ${name}  ${dim(fsu.tildify(dest))}`);
  if (otherHas) console.log(dim(`note: '${name}' is still installed in the ${global ? 'project' : 'global'} scope — remove that too: skills-atlas remove ${name} ${otherFlag}`));
};
