// `skills-atlas feedback` — the autopilot's local suppression list: skills you've
// explicitly dismissed are never suggested again. Show / add to / reset it.
// All local; nothing is sent anywhere.
'use strict';

const { parse } = require('../args');
const feedback = require('../feedback');
const { green, dim } = require('../format');

const HELP = `usage: skills-atlas feedback [dismiss <skill> | reset]

Skills the autopilot won't suggest again — the ones you've dismissed. Local only;
nothing is sent. Installing a skill clears its dismiss. (Removing a skill does NOT
suppress it — that's just cleanup.)

  feedback                  show the suppression list
  feedback dismiss <skill>  never suggest a skill again
  feedback reset            forget everything
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
    feedback.record({ skill: x, signal: 'dismissed' });
    console.log(values.json ? JSON.stringify({ dismissed: x }) : `${green('✓')} won't suggest ${x} again.`);
    return;
  }

  const events = feedback.read().events;
  const prof = feedback.profile(events);
  if (values.json) {
    console.log(JSON.stringify({ actions: events.length, suppressed: [...prof.suppressed] }, null, 2));
    return;
  }
  if (!prof.suppressed.size) {
    console.log(dim('nothing suppressed — run `skills-atlas feedback dismiss <skill>` and the\nautopilot stops offering that skill.'));
    return;
  }
  console.log(`\n${green("won't suggest again")} (${prof.suppressed.size}): ${[...prof.suppressed].join(', ')}`);
  console.log(dim(`from ${events.length} recorded action(s).  re-install one to clear it, or: skills-atlas feedback reset`));
};
