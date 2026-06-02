// `skills-atlas feedback` — show what the autopilot learned from your actions
// (so suggestions sharpen the more you use it), and let you dismiss / reset it.
// All local; nothing is sent anywhere.
'use strict';

const { parse } = require('../args');
const feedback = require('../feedback');
const { green, dim, bold } = require('../format');

const HELP = `usage: skills-atlas feedback [dismiss <skill> | reset]

What the autopilot has learned from your installs/removes — locally — to make its
suggestions sharper. Nothing is sent anywhere.

  feedback                  show what it learned
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
    console.log(JSON.stringify({ actions: events.length, categories: [...prof.catNet], suppressed: [...prof.suppressed] }, null, 2));
    return;
  }
  if (!events.length) {
    console.log(dim('no feedback yet — as you install / remove / dismiss skills, it learns what you like.'));
    return;
  }
  console.log(`\n${bold('learned from')} ${events.length} action(s):`);
  const cats = [...prof.catNet.entries()].sort((a, b) => b[1] - a[1]);
  if (cats.length) {
    console.log(dim('  category affinity (nudges ranking):'));
    for (const [cat] of cats) {
      const m = prof.affinity(cat);
      console.log(`    ${m >= 1 ? green('↑') : dim('↓')} ${cat}  ${dim('×' + m.toFixed(2))}`);
    }
  }
  if (prof.suppressed.size) console.log(dim(`  won't suggest: ${[...prof.suppressed].join(', ')}`));
  console.log(dim('\nreset with: skills-atlas feedback reset'));
};
