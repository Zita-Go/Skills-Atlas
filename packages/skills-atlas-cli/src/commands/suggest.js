// `skills-atlas suggest` — the autopilot. Runs as a Claude Code UserPromptSubmit
// hook: reads the event JSON from stdin, retrieves a SHORTLIST of catalog skills
// that may fit the prompt (recall), and injects them as additionalContext for
// Claude to judge (precision) — Claude offers one only if it genuinely fits, and
// can run `skills-atlas search` itself to look further. ALWAYS exits 0 and never
// blocks the user (fail-open). Matching is local-only — the prompt is never sent
// anywhere.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadData } = require('../data');
const { buildIndices } = require('../index-build');
const { suggestCandidates } = require('../search-core');
const manifest = require('../manifest');
const fsu = require('../fsutil');

const COOLDOWN = 3; // min prompts between suggestions

function stateFile(sessionId) {
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  const id = String(sessionId || 'nosession').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return path.join(base, 'skills-atlas', 'suggest', `${id}.json`);
}
function readState(f) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); }
  catch { return { count: 0, lastSuggestedCount: -COOLDOWN, suggested: [] }; }
}
function writeState(f, s) {
  try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(s)); } catch { /* ignore */ }
}

module.exports = async function suggest() {
  try {
    if (process.stdin.isTTY) {
      console.error('skills-atlas suggest is a UserPromptSubmit hook (reads the event JSON from stdin).');
      console.error('enable the autopilot with:  skills-atlas hook on');
      return;
    }

    let event = {};
    try { event = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { /* not JSON → bail */ }
    const prompt = event.prompt || '';
    if (!prompt || prompt.length < 8) return;

    const file = stateFile(event.session_id || event.sessionId);
    const state = readState(file);
    state.count = (state.count || 0) + 1;

    // cooldown — don't suggest on every prompt
    if (state.count - (state.lastSuggestedCount ?? -COOLDOWN) < COOLDOWN) { writeState(file, state); return; }

    const { data } = loadData({ quiet: true });
    const { flatRows } = buildIndices(data);

    const installed = new Set();
    for (const s of fsu.scopesFor({})) for (const e of manifest.list(s.root)) installed.add(e.skill);
    const suggested = new Set(state.suggested || []);

    const { fire, candidates } = suggestCandidates(flatRows, prompt, { installed, suggested });
    if (!fire) { writeState(file, state); return; }

    const lines = candidates.map(c => {
      const uc = (c.row.use_case_en || c.row.use_case || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      return `- ${c.skill}${uc ? ` — ${uc}` : ''}  (details: \`skills-atlas info ${c.skill}\` · use now: \`skills-atlas use ${c.skill} --yes\`)`;
    }).join('\n');
    const ctx =
      `[Skills Atlas autopilot] The user may be doing something one of these installable agent ` +
      `skills is built for. Judge for yourself — do NOT mention any of this unless one of them ` +
      `genuinely fits what they actually asked:\n${lines}\n` +
      `If one genuinely fits, DON'T just name it: in one line tell the user what it does and why it ` +
      `fits THIS task (it's a curated skill from the Skills Atlas catalog, not something you made up), ` +
      `then let them choose — activate it now (\`skills-atlas use <skill> --yes\` installs + applies it ` +
      `immediately), see what it covers first (\`skills-atlas info <skill>\`), or skip and you'll just ` +
      `do the task yourself. If none fit but the task plainly needs a specialized skill, you may run ` +
      `\`skills-atlas search "<short intent>"\` to look further. If nothing fits, say nothing about this ` +
      `at all — don't mention this hook, these skills, or that a suggestion was made.`;
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: ctx } }));

    state.lastSuggestedCount = state.count;
    state.suggested = [...suggested, ...candidates.map(c => c.skill)];
    writeState(file, state);
  } catch {
    // fail-open: never break the user's workflow
  }
};
