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
const registry = require('../registry');
const transcripts = require('../transcripts');
const gapstate = require('../gapstate');
const prunestate = require('../prunestate');
const prune = require('./prune');

const COOLDOWN = 3; // min prompts between suggestions
const GAP_EVERY = 12; // a gap nudge is only considered at every Nth prompt (per session)

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

function emit(ctx) {
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: ctx } }));
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
    const ap = registry.getAutopilot();

    // --- Proactive gap nudge: periodic, and refired when the recurring work shifts
    // to something new (anti-spam floor + activity fingerprint, not a daily clock) ---
    if (ap.gapAlerts && state.count % GAP_EVERY === 0) {
      const recent = transcripts.recentPrompts({ max: 20 });
      if (recent.length >= 8) {
        const gs = gapstate.read();
        const { fire, sig } = gapstate.shouldNudge(gs, recent, Date.now());
        if (fire) {
          const dismissed = gs.dismissed || [];
          const lines = recent.map(r => `- ${r.text.replace(/\s+/g, ' ').slice(0, 100)}`).join('\n');
          const days = Math.max(1, Math.round((Date.now() - recent[recent.length - 1].ts) / 86400000));
          emit(`[Skills Atlas — capability gaps] The user's recent requests (${recent.length} over ~${days} day(s), newest first):\n${lines}\n` +
            `If a recurring KIND of work stands out that an installable catalog skill is built for and they haven't ` +
            `installed (ignore one-offs), name the pattern with rough frequency as evidence and recommend it — verify with ` +
            `\`skills-atlas info <skill>\` and install with \`skills-atlas use <skill> --yes\`.` +
            (dismissed.length ? ` Already dismissed (skip): ${dismissed.join(', ')}.` : '') +
            ` If nothing clearly recurs or it doesn't fit right now, stay silent.`);
          gapstate.touchNudge(sig);
          writeState(file, state);
          return;
        }
      }
    }

    // --- Proactive prune nudge: installed skills that may no longer fit the user's
    // work. Offset from the gap check so the two never fire on the same prompt. ---
    if (ap.prune && state.count % GAP_EVERY === Math.floor(GAP_EVERY / 2)) {
      const recent = transcripts.recentPrompts({ max: 30 });
      if (recent.length >= 8) {
        const ps = prunestate.read();
        const { fire, sig } = gapstate.shouldNudge(ps, recent, Date.now());
        if (fire) {
          const { data } = loadData({ quiet: true });
          const installed = prune.reviewList(data, ps.dismissed || [], Date.now());
          if (installed.length) {
            emit(prune.digestText(installed, recent, ps.dismissed || []));
            prunestate.touchNudge(sig);
            writeState(file, state);
            return;
          }
        }
      }
    }

    // --- Per-prompt autopilot (gated by the suggest toggle + cooldown) ---
    if (!ap.suggest) { writeState(file, state); return; }
    if (state.count - (state.lastSuggestedCount ?? -COOLDOWN) < COOLDOWN) { writeState(file, state); return; }

    const { data } = loadData({ quiet: true });
    const { flatRows } = buildIndices(data);
    const installed = new Set();
    for (const s of fsu.scopesFor({})) for (const e of manifest.list(s.root)) installed.add(e.skill);
    const suggested = new Set(state.suggested || []);

    const { fire, candidates } = suggestCandidates(flatRows, prompt, { installed, suggested });
    if (!fire || !candidates.length) { writeState(file, state); return; }

    const lines = candidates.map(c => {
      const uc = (c.row.use_case_en || c.row.use_case || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      return `- ${c.skill}${uc ? ` — ${uc}` : ''}  (details: \`skills-atlas info ${c.skill}\` · use now: \`skills-atlas use ${c.skill} --yes\`)`;
    }).join('\n');
    emit(
      `[Skills Atlas autopilot] The user may be doing something one of these installable agent ` +
      `skills is built for. Judge for yourself — do NOT mention any of this unless one of them ` +
      `genuinely fits what they actually asked:\n${lines}\n` +
      `If one genuinely fits, DON'T just name it: in one line tell the user what it does and why it ` +
      `fits THIS task (it's a curated skill from the Skills Atlas catalog, not something you made up), ` +
      `then let them choose — activate it now (\`skills-atlas use <skill> --yes\` installs + applies it ` +
      `immediately), see what it covers first (\`skills-atlas info <skill>\`), or skip and you'll just ` +
      `do the task yourself. If none fit but the task plainly needs a specialized skill, you may run ` +
      `\`skills-atlas search "<short intent>"\` to look further. If nothing fits, say nothing about this ` +
      `at all — don't mention this hook, these skills, or that a suggestion was made.`);
    state.lastSuggestedCount = state.count;
    state.suggested = [...suggested, ...candidates.map(c => c.skill)];
    writeState(file, state);
  } catch {
    // fail-open: never break the user's workflow
  }
};
