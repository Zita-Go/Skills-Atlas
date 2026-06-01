// `skills-atlas prune` — the inverse of `gaps`. Surface the user's INSTALLED skills
// (with install age + what each does) plus their recent activity, and a judging
// instruction, so CLAUDE spots skills that no longer fit the user's work and offers
// to remove them. We provide the data; Claude judges. NEVER deletes. No network.
'use strict';

const { parse } = require('../args');
const { loadData } = require('../data');
const { buildIndices, rowsFor } = require('../index-build');
const fsu = require('../fsutil');
const manifest = require('../manifest');
const transcripts = require('../transcripts');
const prunestate = require('../prunestate');
const { dim, green } = require('../format');

const FRESH_DAYS = 14; // never suggest removing something installed this recently

const HELP = `usage: skills-atlas prune [dismiss <skill> | clear]

Surface your installed skills + recent Claude Code activity so Claude can spot ones
you no longer use and offer to remove them. Run it in Claude Code (or ask Claude
"any skills I can clean up?"). Never deletes anything — you confirm each removal.

  prune                 review installed skills vs recent activity → Claude suggests
  prune dismiss <skill> stop suggesting to remove one
  prune clear           reset dismissals
  --json`;

// Installed skills (both scopes) worth reviewing: older than FRESH_DAYS and not
// dismissed, annotated with install age + what each does (from the catalog).
function reviewList(data, dismissed, now) {
  const idx = buildIndices(data);
  const out = [];
  for (const s of fsu.scopesFor({})) {
    for (const e of manifest.list(s.root)) {
      if (dismissed.includes(e.skill)) continue;
      const ageDays = e.installedAt ? Math.floor((now - Date.parse(e.installedAt)) / 86400000) : null;
      if (ageDays !== null && ageDays >= 0 && ageDays < FRESH_DAYS) continue; // give new installs time
      const row = rowsFor(idx.skillIndex, e.skill)[0];
      out.push({
        skill: e.skill,
        scope: s.name,
        ageDays,
        use: row ? (row.use_case_en || row.use_case || '') : '',
      });
    }
  }
  return out;
}

const instruction = dismissed =>
  `Each skill above is installed but might no longer fit what the user is doing. From their recent ` +
  `activity, flag any installed skill whose domain hasn't come up lately and they're unlikely to need ` +
  `right now: name it, say briefly why it looks unused, and offer to remove it with ` +
  `\`skills-atlas remove <skill>\` (add --project for a project-scoped one). NEVER remove anything ` +
  `yourself — always let the user decide.` +
  (dismissed.length ? ` Already dismissed (skip these): ${dismissed.join(', ')}.` : '') +
  ` If every installed skill still fits their work, say nothing needs pruning.`;

// The full text block handed to Claude (shared by the command and the hook nudge).
function digestText(installed, recent, dismissed) {
  const skills = installed.map(s =>
    `  - ${s.skill} [${s.scope}]${s.ageDays != null ? ` · installed ${s.ageDays}d ago` : ''}` +
    `${s.use ? ` · ${s.use.replace(/\s+/g, ' ').slice(0, 70)}` : ''}`).join('\n');
  const activity = recent.length
    ? recent.slice(0, 30).map(r => `  - ${r.text.replace(/\s+/g, ' ').slice(0, 100)}`).join('\n')
    : '  (no recent activity found)';
  return `[Skills Atlas — prune] Installed skills (older than ${FRESH_DAYS}d, newest activity below):\n${skills}\n\n` +
    `The user's recent activity (newest first):\n${activity}\n\n${instruction(dismissed)}`;
}

module.exports = async function pruneCmd(argv) {
  const { values, positionals } = parse(argv, ['json']);
  if (values.help) { console.log(HELP); return; }
  const sub = positionals[0];

  if (sub === 'clear') {
    prunestate.clear();
    console.log(values.json ? JSON.stringify({ cleared: true }) : `${green('✓')} dismissals reset.`);
    return;
  }
  if (sub === 'dismiss') {
    const x = positionals.slice(1).join(' ');
    if (!x) { console.error('usage: skills-atlas prune dismiss <skill>'); process.exitCode = 1; return; }
    prunestate.dismiss(x);
    console.log(values.json ? JSON.stringify({ dismissed: x }) : `${green('✓')} won't suggest removing: ${x}`);
    return;
  }

  const { data } = loadData({ quiet: values.json });
  const dismissed = prunestate.read().dismissed || [];
  const installed = reviewList(data, dismissed, Date.now());
  const recent = transcripts.recentPrompts({ max: 60 });

  if (values.json) { console.log(JSON.stringify({ installed, recent, dismissed }, null, 2)); return; }

  if (!installed.length) {
    console.log(dim(`nothing to review — no skills installed longer than ${FRESH_DAYS} days.`));
    console.log(dim('see what you have: skills-atlas installed'));
    return;
  }
  console.log('\n' + digestText(installed, recent, dismissed));
};

module.exports.reviewList = reviewList;
module.exports.digestText = digestText;
module.exports.FRESH_DAYS = FRESH_DAYS;
