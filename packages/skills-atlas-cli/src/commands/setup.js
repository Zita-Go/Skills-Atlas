// `skills-atlas setup` — post-install onboarding + status. Run manually anytime
// (`skills-atlas setup`), or automatically once at session start via the plugin's
// SessionStart hook (`setup --session-start`). The one-time welcome is gated by a
// marker so it shows once, then stays silent. The session-start welcome is delivered
// via `systemMessage`, which the user sees VERBATIM (the model never sees it / can't
// paraphrase it). All local; nothing is sent.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { parse } = require('../args');
const registry = require('../registry');
const { green, dim, bold } = require('../format');

function cacheFile(name) {
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(base, 'skills-atlas', name);
}
const exists = f => { try { return fs.existsSync(f); } catch { return false; } };
function touch(f) {
  try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, new Date().toISOString() + '\n'); } catch { /* best-effort */ }
}
const onboardedFile = () => cacheFile('onboarded');
// Set by the plugin's welcome.js when the "engine not installed" notice was shown — so
// the eventual real welcome says "Nicely done" instead of the fresh-install greeting.
const installPromptShown = () => exists(cacheFile('install-prompt-shown'));

// The two settings worth surfacing up front (the rest live in the full `setup` view).
function welcomeSettings(ap) {
  return 'Settings:\n' +
    `  language   /skills-atlas:skill-autopilot lang en|zh   (now: ${ap.replyLang})\n` +
    `  autopilot  /skills-atlas:skill-autopilot on|off        (${ap.enabled !== false ? 'on' : 'off'})\n\n` +
    'More: /skills-atlas:setup';
}

// The one-time welcome text, or null if the user was already onboarded. Gated by the global
// `onboarded` marker so it shows exactly once; with { consume: true } it claims that one
// shot (marks onboarded). Shared by the SessionStart hook (`setup --session-start`) and the
// UserPromptSubmit fallback in `suggest` — which catches the case where the plugin was
// installed mid-session and no fresh session-start has fired the welcome yet.
function buildWelcome(ap, { consume = false } = {}) {
  if (exists(onboardedFile())) return null;
  if (consume) touch(onboardedFile());
  const intro = installPromptShown()
    ? '🎉 Nicely done — Skills Atlas is configured and on. It\'ll quietly flag a ready-made skill when one fits, and offer to turn repeated workflows into skills of your own.'
    : '✨ Skills Atlas is on. While you work, it keeps an eye out and quietly flags a ready-made skill the moment one fits — and if you catch yourself doing the same dance over and over, it\'ll offer to turn it into a skill of your own.';
  return intro + '\n\n' + welcomeSettings(ap);
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
    try { fs.rmSync(onboardedFile(), { force: true }); fs.rmSync(cacheFile('install-prompt-shown'), { force: true }); } catch { /* ignore */ }
    console.log(`${green('✓')} onboarding reset — the welcome will show once more next session.`);
    return;
  }

  const ap = registry.getAutopilot();

  // --- Auto path (SessionStart hook): emit a ONE-TIME welcome via systemMessage (shown
  // to the user verbatim), then stay silent forever. "Nicely done" variant if the user
  // came here after the engine-not-installed notice; otherwise the fresh-install greeting. ---
  if (values['session-start']) {
    const msg = buildWelcome(ap, { consume: true });
    if (msg === null) return; // already welcomed → silent
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart' }, systemMessage: msg, suppressOutput: true }));
    return;
  }

  // --- Manual path: human-readable status + what-you-can-do + full settings. ---
  touch(onboardedFile()); // running setup yourself counts as onboarded
  if (values.json) {
    console.log(JSON.stringify({ installed: true, autopilot: ap.enabled !== false, suggest: ap.suggest, gapAlerts: ap.gapAlerts, prune: ap.prune, replyLang: ap.replyLang }));
    return;
  }
  console.log(`${green('✓')} Skills Atlas is installed and ready.`);
  console.log(`  autopilot: ${ap.enabled !== false ? green('on') : dim('off')}   ${dim('toggle: /skills-atlas:skill-autopilot on|off')}`);
  console.log(`\n${bold('What you can do')} — right here in the conversation:`);
  console.log(`  ${green('find & install')}    /skills-atlas:skill-search <query>  →  :skill-install <skill>`);
  console.log(`  ${green('set up a project')}  /skills-atlas:skill-kit   (detects the project type, proposes a kit)`);
  console.log(`  ${green('codify a workflow')} /skills-atlas:skill-craft   (turns something you keep doing into a skill)`);
  console.log(`  ${green('review')}            /skills-atlas:skill-gaps  ·  :skill-prune  ·  :skill-installed`);
  console.log(`\n${bold('Settings')} ${dim('(optional)')}`);
  console.log(`  language    /skills-atlas:skill-autopilot lang en|zh     ${dim('(now: ' + ap.replyLang + ')')}`);
  console.log(`  autopilot   /skills-atlas:skill-autopilot on|off          ${dim('(' + (ap.enabled !== false ? 'on' : 'off') + ')')}`);
  console.log(`  fine-tune   /skills-atlas:skill-autopilot suggest|gaps|prune on|off  ${dim('· model')}`);
  console.log(dim('\nThe autopilot also suggests skills proactively as you work — each judged for fit. Nothing leaves your machine.'));
};

// Reused by `suggest`'s first-run fallback (see src/commands/suggest.js).
module.exports.buildWelcome = buildWelcome;
