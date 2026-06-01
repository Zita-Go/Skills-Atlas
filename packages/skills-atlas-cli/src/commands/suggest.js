// `skills-atlas suggest` — the autopilot. Runs as a Claude Code UserPromptSubmit
// hook: reads the event JSON from stdin, matches the prompt against the catalog
// locally, and (if a strong, fresh, not-installed match survives a cooldown)
// emits a one-line additionalContext for Claude to weigh. ALWAYS exits 0 and
// never blocks the user (fail-open). Matching is local-only — the prompt is
// never sent anywhere.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadData } = require('../data');
const { buildIndices } = require('../index-build');
const { pickSuggestion } = require('../search-core');
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

    const pick = pickSuggestion(flatRows, prompt, { installed, suggested });
    if (!pick) { writeState(file, state); return; }

    const uc = pick.row.use_case_en || pick.row.use_case || '';
    const ctx =
      `[Skills Atlas autopilot] The user's task may fit the installable agent skill ` +
      `\`${pick.skill}\`${uc ? ` (catalog use-case: "${uc}")` : ''}. ONLY if it's clearly ` +
      `relevant to what they actually asked, briefly offer it — they can install and ` +
      `activate it now with \`skills-atlas use ${pick.skill} --yes\`. If it isn't a strong ` +
      `fit, don't mention it.`;
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: ctx } }));

    state.lastSuggestedCount = state.count;
    state.suggested = [...suggested, pick.skill];
    writeState(file, state);
  } catch {
    // fail-open: never break the user's workflow
  }
};
