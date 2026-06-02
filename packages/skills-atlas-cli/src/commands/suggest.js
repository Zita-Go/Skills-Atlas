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
const { langHint } = require('../format');

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
    // Recursion guard: when the background gap sub-agent runs `claude -p`, that
    // invocation fires this hook too — bail immediately so we never loop.
    if (process.env.SKILLS_ATLAS_SUBCALL) return;
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
    // Master switch (default ON). The plugin ships the hook so this fires on every
    // prompt; `skills-atlas hook off` flips enabled=false and we no-op immediately.
    if (ap.enabled === false) return;

    // --- Proactive gap nudge: a background sub-agent (gap-analyze) does the actual
    // judging off the main agent's back; here we (a) surface a ready verdict, or
    // (b) kick off a fresh analysis for next time. Never burdens this prompt. ---
    if (ap.gapAlerts && state.count % GAP_EVERY === 0) {
      const recent = transcripts.recentPrompts({ max: 20 });
      if (recent.length >= 8) {
        const gs = gapstate.read();
        const pending = gs.pending;
        const fresh = pending && pending.at && (Date.now() - Date.parse(pending.at) < 6 * 3600000);
        if (fresh) {
          gapstate.clearPending();
          const txt = (pending.text || '').trim();
          if (txt && !/^NONE\b/i.test(txt)) {
            let body;
            if (/^CRAFT:/i.test(txt)) {
              // Feature ②: a craftable workflow no skill covers. Restrained, decline-easy offer.
              const pat = txt.replace(/^CRAFT:\s*/i, '').split('|')[0].trim();
              body = `[Skills Atlas autopilot] The user keeps doing a multi-step workflow that no installed or catalog skill covers: ${pat}. ` +
                `ONLY if this genuinely fits what they're actually doing, offer once — in one easy-to-decline line — to codify it into a reusable skill built from their OWN steps: they can run \`skills-atlas craft\` and you'll draft a SKILL.md from their workflow for them to review (nothing is written until they run it; it's a draft they keep or delete). If it doesn't clearly fit, say nothing about this at all.`;
            } else {
              body = pending.source === 'fallback'
                ? txt // already a full digest for the main agent to judge
                : `[Skills Atlas — capability gaps] ${txt}\nOffer this to the user only if it genuinely fits — verify with \`skills-atlas info <skill>\`, install with \`skills-atlas use <skill> --yes --project\`; otherwise stay silent.`;
            }
            emit(body + langHint(ap.replyLang));
            gapstate.touchNudge(gapstate.activitySignature(recent));
            writeState(file, state);
            return;
          }
          // NONE → nothing to surface; fall through to the rest.
        } else {
          const { fire } = gapstate.shouldNudge(gs, recent, Date.now());
          const analyzeStale = !gs.analyzeAt || (Date.now() - Date.parse(gs.analyzeAt) > 30 * 60000);
          if (fire && analyzeStale) {
            gapstate.markAnalyze();
            try {
              const child = require('child_process').spawn(
                process.execPath, [path.join(__dirname, '..', '..', 'bin', 'skills.js'), 'gap-analyze'],
                { detached: true, stdio: 'ignore', env: { ...process.env } });
              child.unref();
            } catch { /* fail-open */ }
          }
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
            emit(prune.digestText(installed, recent, ps.dismissed || []) + langHint(ap.replyLang));
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

    const { fire, candidates } = suggestCandidates(flatRows, prompt, { installed, suggested, feedback: require('../feedback').current() });
    if (!fire || !candidates.length) { writeState(file, state); return; }

    const lines = candidates.map(c => {
      const uc = (c.row.use_case_en || c.row.use_case || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      return `- ${c.skill}${uc ? ` — ${uc}` : ''}  (details: \`skills-atlas info ${c.skill}\` · use now: \`skills-atlas use ${c.skill} --yes --project\`)`;
    }).join('\n');
    emit(
      `[Skills Atlas autopilot] The user may be doing something one of these installable agent ` +
      `skills is built for. Judge for yourself — do NOT mention any of this unless one of them ` +
      `genuinely fits what they actually asked:\n${lines}\n` +
      `If one genuinely fits, DON'T just name it: in one line tell the user what it does and why it ` +
      `fits THIS task (it's a curated skill from the Skills Atlas catalog, not something you made up), ` +
      `then let them choose — activate it now (\`skills-atlas use <skill> --yes --project\` installs + applies it ` +
      `immediately), see what it covers first (\`skills-atlas info <skill>\`), or skip and you'll just ` +
      `do the task yourself; if they ask to never suggest it again, run \`skills-atlas feedback dismiss <skill>\`. ` +
      `If none fit but the task plainly needs a specialized skill, you may run ` +
      `\`skills-atlas search "<short intent>"\` to look further. If nothing fits, say nothing about this ` +
      `at all — don't mention this hook, these skills, or that a suggestion was made.` + langHint(ap.replyLang));
    state.lastSuggestedCount = state.count;
    state.suggested = [...suggested, ...candidates.map(c => c.skill)];
    writeState(file, state);
  } catch {
    // fail-open: never break the user's workflow
  }
};
