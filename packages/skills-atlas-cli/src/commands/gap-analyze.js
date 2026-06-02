// `skills-atlas gap-analyze` — the background gap sub-agent. Normally spawned
// (detached) by the autopilot hook: it asks a SMALL model (default Haiku) to spot
// one recurring capability gap from your recent activity, off the main agent's
// back, and stashes the verdict for the hook to surface next tick. Run it directly
// (--show / --once) to test. Fully fail-open: any failure → a local fallback, never
// blocks or errors. The model call reuses your Claude Code login (no API key).
'use strict';

const { spawn } = require('child_process');
const { parse } = require('../args');
const { loadData } = require('../data');
const { buildIndices } = require('../index-build');
const fsu = require('../fsutil');
const manifest = require('../manifest');
const transcripts = require('../transcripts');
const gapstate = require('../gapstate');
const registry = require('../registry');
const gaps = require('./gaps');
const { dim, green } = require('../format');

const CLAUDE_BIN = process.env.SKILLS_ATLAS_CLAUDE_BIN || 'claude';
const TIMEOUT_MS = Number(process.env.SKILLS_ATLAS_GAP_TIMEOUT_MS) || 90000;

function gather() {
  const recent = transcripts.recentPrompts({ max: 20 });
  const gs = gapstate.read();
  const dismissed = gs.dismissed || [];
  const { data } = loadData({ quiet: true });
  const { flatRows } = buildIndices(data);
  const installed = new Set();
  for (const s of fsu.scopesFor({})) for (const e of manifest.list(s.root)) installed.add(e.skill);
  const candidates = gaps.candidatePool(flatRows, recent, { installed, dismissed });
  const ap = registry.getAutopilot();
  return { recent, dismissed, candidates, model: ap.gapModel, lang: ap.replyLang };
}

// Run `claude -p --model <model>` with the prompt on stdin. Reuses Claude Code's
// own auth (subscription or API key); never throws.
function runClaude(prompt, model) {
  return new Promise(resolve => {
    let out = '', err = '', done = false;
    const finish = r => { if (!done) { done = true; resolve(r); } };
    let child;
    try {
      child = spawn(CLAUDE_BIN, ['-p', '--model', model], {
        env: { ...process.env, SKILLS_ATLAS_SUBCALL: '1' }, // breaks hook recursion
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (e) { return finish({ ok: false, error: `spawn: ${e.message}` }); }
    const timer = setTimeout(() => { try { child.kill('SIGKILL'); } catch { /* */ } finish({ ok: false, error: 'timeout' }); }, TIMEOUT_MS);
    child.on('error', e => { clearTimeout(timer); finish({ ok: false, error: e.message }); });
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    child.on('close', code => {
      clearTimeout(timer);
      if (code === 0 && out.trim()) finish({ ok: true, text: out.trim() });
      else finish({ ok: false, error: `exit ${code}${err ? ': ' + err.slice(0, 200) : ''}` });
    });
    try { child.stdin.write(prompt); child.stdin.end(); } catch { /* 'error' handles it */ }
  });
}

module.exports = async function gapAnalyze(argv) {
  const { values } = parse(argv, ['json', 'show', 'once']);
  if (values.help) {
    console.log('usage: skills-atlas gap-analyze [--show | --once]\n\n' +
      'Background gap sub-agent (usually spawned by the autopilot hook). Asks a small\n' +
      'model to spot one recurring capability gap from recent activity.\n' +
      '  --show   print the exact prompt it would send (no model call)\n' +
      '  --once   actually call the model now and print the result');
    return;
  }
  try {
    const g = gather();
    if (g.recent.length < 8) {
      if (values.show || values.once) console.error(dim(`not enough recent activity (${g.recent.length} < 8) — nothing to analyze.`));
      return;
    }
    const prompt = gaps.analysisPrompt(g.recent, g.candidates, g.dismissed, g.lang);

    if (values.show) {
      console.log(dim(`# would run: ${CLAUDE_BIN} -p --model ${g.model}   (prompt piped on stdin)\n`));
      console.log(prompt);
      return;
    }

    const r = await runClaude(prompt, g.model);
    if (r.ok) {
      gapstate.writePending({ text: r.text, source: g.model });
      if (values.once) console.log(`${green('✓')} ${g.model} →\n${r.text}`);
    } else {
      // fail-open: stash the local inline digest so the hook still surfaces SOMETHING
      // (the previous behavior, just one tick later) instead of going silent.
      gapstate.writePending({ text: gaps.digest(g.recent, g.dismissed, g.candidates), source: 'fallback' });
      if (values.once) console.error(dim(`claude unavailable (${r.error}) — wrote local fallback digest instead.`));
    }
  } catch (e) {
    if (values.once) console.error(dim(`gap-analyze error: ${e.message}`));
  }
};
