// `skills-atlas feedback` — the autopilot's local suppression list. Two scopes:
// skills you've dismissed (never suggested, anywhere) and skills you've removed from
// THIS project (not suggested here). Show / add to / reset it. Nothing is sent.
'use strict';

const { parse } = require('../args');
const feedback = require('../feedback');
const { green, dim } = require('../format');

const HELP = `usage: skills-atlas feedback [dismiss <skill> | reset]

Skills the autopilot won't suggest again. Two kinds, local only — nothing is sent:
  • dismissed — you said "never suggest this"; applies in every project
  • removed   — you removed it from THIS project; suppressed here only
Installing a skill clears both. (Removing one from the global scope is just an
uninstall — it does not suppress; use 'dismiss' for a blanket no.)

  feedback                  show the suppression list (this project + global)
  feedback dismiss <skill>  never suggest a skill again, in any project
  feedback reset            forget everything (global + this project)
  --json`;

module.exports = async function feedbackCmd(argv) {
  const { values, positionals } = parse(argv, ['json']);
  if (values.help) { console.log(HELP); return; }
  const sub = positionals[0];

  if (sub === 'reset') {
    feedback.clear();
    console.log(values.json ? JSON.stringify({ reset: true }) : `${green('✓')} feedback reset.`);
    return;
  }
  if (sub === 'dismiss') {
    const x = positionals.slice(1).join(' ');
    if (!x) { console.error('usage: skills-atlas feedback dismiss <skill>'); process.exitCode = 1; return; }
    feedback.dismiss(x);
    console.log(values.json ? JSON.stringify({ dismissed: x }) : `${green('✓')} won't suggest ${x} again (any project).`);
    return;
  }

  const cur = feedback.current();
  if (values.json) {
    console.log(JSON.stringify({ dismissed: [...cur.global], removedHere: [...cur.project] }, null, 2));
    return;
  }
  if (!cur.global.size && !cur.project.size) {
    console.log(dim('nothing suppressed — run `skills-atlas feedback dismiss <skill>`, or remove a\nskill from this project, and the autopilot stops offering it.'));
    return;
  }
  if (cur.global.size) console.log(`\n${green("won't suggest anywhere")} (${cur.global.size}): ${[...cur.global].join(', ')}`);
  if (cur.project.size) console.log(`${green("won't suggest in this project")} (${cur.project.size}): ${[...cur.project].join(', ')}`);
  console.log(dim('re-install one to clear it, or: skills-atlas feedback reset'));
};
