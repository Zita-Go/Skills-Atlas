// `skills-atlas craft` — feature ②: codify the user's OWN repeated workflow into a
// new local SKILL.md. Run it in Claude Code: it hands the MAIN agent the detected
// pattern + fuller evidence + a hardened authoring instruction, and the agent drafts
// ./.claude/skills/<name>/SKILL.md for the user to review. It writes nothing itself.
'use strict';

const { parse } = require('../args');
const transcripts = require('../transcripts');
const gapstate = require('../gapstate');
const gaps = require('./gaps');
const registry = require('../registry');
const { dim, langHint } = require('../format');

const HELP = `usage: skills-atlas craft

Codify a multi-step workflow you keep repeating into a new local skill — distilled
from your OWN steps, written by Claude for you to review. Run it inside Claude Code.
Reads your local transcripts; nothing is stored or sent. It writes nothing itself —
it hands Claude an instruction; Claude drafts ./.claude/skills/<name>/SKILL.md, and
only if your workflow carries a real user-specific delta (otherwise it declines).

  craft        draft a skill from the workflow the autopilot flagged (or recent activity)
  --json       print the detected pattern + evidence as JSON
  --show       alias for the default (print the instruction)`;

module.exports = async function craftCmd(argv) {
  const { values } = parse(argv, ['json', 'show']);
  if (values.help) { console.log(HELP); return; }

  const recent = transcripts.recentPrompts({ max: 30 });
  const pending = gapstate.readCraft();
  const pattern = pending && pending.pattern
    ? pending.pattern
    : '(no pre-detected pattern — infer the user\'s repeated multi-step procedure from the evidence below; if there is no genuine user-specific delta, do NOT write a skill, per the gate.)';

  if (values.json) {
    console.log(JSON.stringify({
      pattern: pending ? pending.pattern : null,
      fromAutopilot: !!pending,
      evidence: gaps.craftEvidence(recent),
    }, null, 2));
    return;
  }

  if (!recent.length) {
    console.log(dim('no recent activity to craft from — use Claude Code for a while, then run this in a session.'));
    return;
  }

  // Surfaced → consume it so the same pattern isn't offered again.
  if (pending) gapstate.clearCraft();
  console.log('\n' + gaps.craftInstruction(pattern, recent) + langHint(registry.getAutopilot().replyLang));
};
