// `skills-atlas gaps` — report the kinds of work you keep doing without a skill
// (tracked locally by the autopilot hook), or dismiss/clear them. No network.
'use strict';

const { parse } = require('../args');
const gaps = require('../gaps');
const manifest = require('../manifest');
const fsu = require('../fsutil');
const { bold, dim, green, yellow } = require('../format');

const HELP = `usage: skills-atlas gaps [dismiss <group> | clear]

Show the kinds of work you repeatedly do without a matching skill (tracked by the
autopilot hook — \`skills-atlas hook on\`). All local; aggregate counts only.

  gaps                  the report
  gaps dismiss <group>  stop surfacing a gap
  gaps clear            wipe the tally  (--yes to skip confirm)
  --json`;

function installedSet() {
  const s = new Set();
  for (const sc of fsu.scopesFor({})) for (const e of manifest.list(sc.root)) s.add(e.skill);
  return s;
}

module.exports = async function gapsCmd(argv) {
  const { values, positionals } = parse(argv, ['json', 'yes']);
  if (values.help) { console.log(HELP); return; }
  const sub = positionals[0];
  const now = Date.now();

  if (sub === 'clear') {
    gaps.clearStore();
    console.log(values.json ? JSON.stringify({ cleared: true }) : `${green('✓')} gap tally cleared.`);
    return;
  }
  if (sub === 'dismiss') {
    const group = positionals.slice(1).join(' ');
    if (!group) { console.error('usage: skills-atlas gaps dismiss <group>'); process.exitCode = 1; return; }
    const s = gaps.readStore(); gaps.dismiss(s, group, now); gaps.writeStore(s);
    console.log(values.json ? JSON.stringify({ dismissed: group }) : `${green('✓')} dismissed: ${group}`);
    return;
  }

  const store = gaps.pruneOld(gaps.readStore(), now);
  const installed = installedSet();
  const list = gaps.computeGaps(store, { now, installed });
  const warmMin = Math.max(2, gaps.THRESHOLD() - 2);
  const warming = gaps.computeGaps(store, { now, installed, threshold: warmMin })
    .filter(g => !list.find(x => x.group === g.group));

  if (values.json) { console.log(JSON.stringify({ gaps: list, warming }, null, 2)); return; }

  if (!list.length && !warming.length) {
    console.log(dim('no capability gaps yet.'));
    console.log(dim('gaps build as the autopilot hook sees repeated work — `skills-atlas hook on` to track.'));
    return;
  }
  if (list.length) {
    console.log(`\n${bold('Capability gaps')} ${dim('— kinds of work you keep doing without a skill:')}`);
    for (const g of list) {
      const days = Math.max(1, Math.round((now - g.firstTs) / 86400000));
      console.log(`\n  ${yellow('●')} ${bold(g.group)}  ${dim(`(${g.count}× over ${days} day(s))`)}`);
      console.log(`    → ${green(g.recommended)}  ${dim('skills-atlas use ' + g.recommended + '  ·  info ' + g.recommended)}`);
    }
    console.log(dim(`\ndismiss: skills-atlas gaps dismiss "<group>"   ·   reset: skills-atlas gaps clear`));
  }
  if (warming.length) {
    console.log(dim(`\nwarming up: ${warming.map(g => g.group + ' (' + g.count + ')').join(', ')}`));
  }
};
