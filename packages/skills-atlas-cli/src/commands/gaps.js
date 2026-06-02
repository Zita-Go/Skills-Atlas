// `skills-atlas gaps` — surface the user's recent activity + a judging instruction
// so CLAUDE (running this in Claude Code) spots recurring needs no skill covers yet.
// We provide memory (recent prompts) + the ask; Claude does the judgment. No network.
'use strict';

const { parse } = require('../args');
const { loadData } = require('../data');
const { buildIndices } = require('../index-build');
const fsu = require('../fsutil');
const manifest = require('../manifest');
const transcripts = require('../transcripts');
const gapstate = require('../gapstate');
const registry = require('../registry');
const { dim, green, langHint } = require('../format');

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

const { runSearch } = require('../search-core');

// Lexical recall over the AGGREGATED recent activity → candidate skills the user
// hasn't installed. The signal is stronger than any single prompt; the model
// (or Claude) then does the semantic pick.
function candidatePool(flatRows, recent, { installed = new Set(), dismissed = [], limit = 8 } = {}) {
  const query = recent.map(r => r.text).join(' ').slice(0, 2000);
  const { rows } = runSearch(flatRows, { query });
  const skip = new Set([...installed, ...dismissed]);
  const out = [];
  for (const r of rows) {
    if (out.length >= limit) break;
    const s = (r.skills || []).find(x => !skip.has(x) && !out.some(c => c.skill === x));
    if (s) out.push({ skill: s, use: (r.use_case_en || r.use_case || '').replace(/\s+/g, ' ').slice(0, 60) });
  }
  return out;
}

const activityLines = recent => recent.slice(0, 40).map(r => `  - ${r.text.replace(/\s+/g, ' ').slice(0, 100)}`).join('\n');
const candidateLines = c => c.length
  ? '\n\nInstallable catalog skills that may be relevant (verify before recommending):\n' + c.map(x => `  - ${x.skill}${x.use ? ` — ${x.use}` : ''}`).join('\n') : '';

// The inline digest the MAIN agent judges (also the fallback when no sub-model is available).
function digest(recent, dismissed, candidates = []) {
  const days = Math.max(1, Math.round((Date.now() - recent[recent.length - 1].ts) / 86400000));
  return `[Skills Atlas — capability gaps] The user's recent requests (${recent.length} over ~${days} day(s), newest first):\n${activityLines(recent)}${candidateLines(candidates)}\n\n${INSTRUCTION(dismissed)}`;
}

// The prompt handed to the small BACKGROUND model. It returns NONE or one line.
function analysisPrompt(recent, candidates, dismissed, lang) {
  const langName = lang === 'zh' ? '简体中文' : 'English';
  return 'You look at a developer\'s recent activity and spot ONE recurring kind of work that an installable "skill" would help with but they haven\'t set up.\n\n' +
    `Recent requests (newest first):\n${activityLines(recent)}\n` +
    (candidates.length ? `\nInstallable catalog skills that may be relevant:\n${candidates.map(c => `- ${c.skill}: ${c.use}`).join('\n')}\n` : '') +
    (dismissed.length ? `\nAlready dismissed (never suggest): ${dismissed.join(', ')}\n` : '') +
    `\nIf there is a CLEAR recurring need that ONE of the listed skills covers, reply with a single line in ${langName}:\n` +
    '  <skill-name> — one short sentence naming the recurring pattern (with rough frequency) and why that skill helps.\n' +
    'Otherwise reply with exactly: NONE\n' +
    'Output ONLY that one line (or NONE), nothing else.';
}

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
  const { data } = loadData({ quiet: true });
  const { flatRows } = buildIndices(data);
  const installed = new Set();
  for (const s of fsu.scopesFor({})) for (const e of manifest.list(s.root)) installed.add(e.skill);
  const candidates = candidatePool(flatRows, recent, { installed, dismissed });
  console.log('\n' + digest(recent, dismissed, candidates) + langHint(registry.getAutopilot().replyLang));
};

module.exports.candidatePool = candidatePool;
module.exports.digest = digest;
module.exports.analysisPrompt = analysisPrompt;
