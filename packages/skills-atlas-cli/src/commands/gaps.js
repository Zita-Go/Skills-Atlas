// `skills-atlas gaps` — surface the user's recent activity + a judging instruction
// so CLAUDE (running this in Claude Code) spots recurring needs no skill covers yet.
// We provide memory (recent prompts) + the ask; Claude does the judgment. No network.
'use strict';

const { parse } = require('../args');
const transcripts = require('../transcripts');
const gapstate = require('../gapstate');
const { dim, green } = require('../format');

const HELP = `usage: skills-atlas gaps [dismiss <skill> | clear]

Surface your recent Claude Code activity so Claude can spot recurring kinds of work
no installed skill covers yet. Run it in Claude Code (or ask Claude "any skills I
should get?"). Reads your local transcripts; nothing is stored or sent.

  gaps                 review recent activity → Claude recommends
  gaps dismiss <skill> stop recommending one
  gaps clear           reset dismissals
  --json`;

const INSTRUCTION = dismissed =>
  `Identify any recurring KIND of work the user keeps doing that an installable catalog skill ` +
  `is built for and they haven't installed. For each real recurring need (ignore one-offs and ` +
  `anything already covered): state the pattern + rough frequency as evidence, then recommend the ` +
  `skill — verify it exists with \`skills-atlas search "<intent>"\` or \`skills-atlas info <skill>\`, ` +
  `and install with \`skills-atlas use <skill> --yes\`.` +
  (dismissed.length ? ` Already dismissed (skip these): ${dismissed.join(', ')}.` : '') +
  ` If nothing clearly recurs, say there are no gaps.`;

module.exports = async function gapsCmd(argv) {
  const { values, positionals } = parse(argv, ['json', 'yes']);
  if (values.help) { console.log(HELP); return; }
  const sub = positionals[0];

  if (sub === 'clear') {
    gapstate.clear();
    console.log(values.json ? JSON.stringify({ cleared: true }) : `${green('✓')} dismissals reset.`);
    return;
  }
  if (sub === 'dismiss') {
    const x = positionals.slice(1).join(' ');
    if (!x) { console.error('usage: skills-atlas gaps dismiss <skill>'); process.exitCode = 1; return; }
    gapstate.dismiss(x);
    console.log(values.json ? JSON.stringify({ dismissed: x }) : `${green('✓')} dismissed: ${x}`);
    return;
  }

  const recent = transcripts.recentPrompts({ max: 60 });
  const dismissed = (gapstate.read().dismissed) || [];
  if (values.json) { console.log(JSON.stringify({ recent, dismissed }, null, 2)); return; }

  if (!recent.length) {
    console.log(dim('no recent activity found to analyze.'));
    console.log(dim('gaps are spotted from your recent Claude Code prompts — use it for a while, then run this in a session.'));
    return;
  }
  const days = Math.max(1, Math.round((Date.now() - recent[recent.length - 1].ts) / 86400000));
  const lines = recent.slice(0, 40).map(r => `  - ${r.text.replace(/\s+/g, ' ').slice(0, 100)}`).join('\n');
  console.log(`\n[Skills Atlas — capability gaps] The user's recent requests across sessions (${recent.length} over ~${days} day(s), newest first):\n${lines}\n\n${INSTRUCTION(dismissed)}`);
};
