// `skills-atlas setup` — post-install onboarding + status. Run manually anytime
// (`skills-atlas setup`), or automatically once at session start via the plugin's
// SessionStart hook (`setup --session-start`). The one-time welcome is gated by a
// marker so it shows once, then stays silent. All local; nothing is sent.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { parse } = require('../args');
const registry = require('../registry');
const { green, dim, bold } = require('../format');

function markerFile() {
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(base, 'skills-atlas', 'onboarded');
}
const onboarded = () => { try { return fs.existsSync(markerFile()); } catch { return false; } };
function markOnboarded() {
  try { fs.mkdirSync(path.dirname(markerFile()), { recursive: true }); fs.writeFileSync(markerFile(), new Date().toISOString() + '\n'); } catch { /* best-effort */ }
}

module.exports = async function setup(argv) {
  const { values } = parse(argv, ['session-start', 'json', 'reset']);
  if (values.help) {
    console.log('usage: skills-atlas setup [--reset]\n\n' +
      'Show what Skills Atlas gives you and the autopilot status. Run it after installing\n' +
      'the plugin. --reset makes the one-time welcome show again next session.');
    return;
  }
  if (values.reset) {
    try { fs.rmSync(markerFile(), { force: true }); } catch { /* ignore */ }
    console.log(`${green('✓')} onboarding reset — the welcome will show once more next session.`);
    return;
  }

  const ap = registry.getAutopilot();

  // --- Auto path (SessionStart hook): emit a ONE-TIME welcome as injected context, then stay silent forever. ---
  if (values['session-start']) {
    if (onboarded()) return; // already welcomed → silent
    markOnboarded();
    const ctx =
      '[Skills Atlas — first run] The Skills Atlas plugin is now active in this project. In ONE short, ' +
      'friendly line, let the user know: its autopilot is on — it quietly suggests an installable catalog ' +
      'skill when one genuinely fits what they are doing, and can turn a workflow they keep repeating into a ' +
      'skill via /skills-atlas:skill-craft. They can search/install skills anytime, run /skills-atlas:setup ' +
      'to see everything, or /skills-atlas:skill-autopilot off to silence it. Say this once now; do NOT ' +
      'repeat it in later turns, and do not let it derail what the user actually asked.';
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: ctx } }));
    return;
  }

  // --- Manual path: human-readable status + what-you-can-do. (Reaching here = the CLI is installed.) ---
  markOnboarded(); // running setup yourself counts as onboarded
  if (values.json) {
    console.log(JSON.stringify({ installed: true, autopilot: ap.enabled !== false, suggest: ap.suggest, gapAlerts: ap.gapAlerts, prune: ap.prune }));
    return;
  }
  console.log(`${green('✓')} Skills Atlas is installed and ready.`);
  console.log(`  autopilot: ${ap.enabled !== false ? green('on') : dim('off')}   ${dim('toggle: /skills-atlas:skill-autopilot on|off')}`);
  console.log(`\n${bold('What you can do')} — right here in the conversation:`);
  console.log(`  ${green('find & install')}    /skills-atlas:skill-search <query>  →  :skill-install <skill>`);
  console.log(`  ${green('set up a project')}  /skills-atlas:skill-kit   (detects the project type, proposes a kit)`);
  console.log(`  ${green('codify a workflow')} /skills-atlas:skill-craft   (turns something you keep doing into a skill)`);
  console.log(`  ${green('review')}            /skills-atlas:skill-gaps  ·  :skill-prune  ·  :skill-installed`);
  console.log(dim('\nThe autopilot also suggests skills proactively as you work — each judged for fit. Nothing leaves your machine.'));
};
