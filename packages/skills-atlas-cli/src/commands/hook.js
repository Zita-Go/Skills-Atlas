// `skills-atlas hook on|off|status` — opt-in switch for the autopilot. Registers
// (or removes) a UserPromptSubmit hook in ~/.claude/settings.json that runs
// `skills-atlas suggest`. Merge-safe (never clobbers other settings), idempotent,
// backs up before writing, removes only our own entry.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { parse } = require('../args');
const { green, dim } = require('../format');

const HOOK_CMD = 'skills-atlas suggest';
const settingsPath = () => path.join(os.homedir(), '.claude', 'settings.json');

function readSettings(p) {
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf8')); // may throw → caller handles
}
const isOurs = e => e && Array.isArray(e.hooks)
  && e.hooks.some(h => h && typeof h.command === 'string' && h.command.includes(HOOK_CMD));

module.exports = async function hook(argv) {
  const { values, positionals } = parse(argv, ['json']);
  if (values.help) { console.log('usage: skills-atlas hook <on|off|status>'); return; }
  const sub = positionals[0] || 'status';
  const p = settingsPath();

  if (sub === 'status') {
    let on = false;
    try { on = ((readSettings(p).hooks || {}).UserPromptSubmit || []).some(isOurs); } catch { /* invalid → off */ }
    if (values.json) { console.log(JSON.stringify({ enabled: on, settings: p })); return; }
    console.log(`autopilot: ${on ? green('on') : dim('off')}   ${dim(p)}`);
    if (!on) console.log(dim('enable: skills-atlas hook on'));
    return;
  }

  if (sub !== 'on' && sub !== 'off') {
    console.error('usage: skills-atlas hook <on|off|status>');
    process.exitCode = 1;
    return;
  }

  let settings;
  try { settings = readSettings(p); }
  catch (e) { console.error(`${p} is not valid JSON — fix it first (${e.message}).`); process.exitCode = 1; return; }

  // Coerce defensively: a user's settings could have `hooks` as a non-object or
  // `UserPromptSubmit` as a non-array. Don't crash on it — start from a clean shape.
  if (!settings.hooks || typeof settings.hooks !== 'object' || Array.isArray(settings.hooks)) settings.hooks = {};
  const arr = Array.isArray(settings.hooks.UserPromptSubmit) ? settings.hooks.UserPromptSubmit : [];

  if (sub === 'on') {
    if (arr.some(isOurs)) { console.log(dim('autopilot already on.')); return; }
    settings.hooks.UserPromptSubmit = [...arr, { matcher: '*', hooks: [{ type: 'command', command: HOOK_CMD, timeout: 5 }] }];
  } else {
    const kept = arr.filter(e => !isOurs(e));
    if (kept.length) settings.hooks.UserPromptSubmit = kept;
    else delete settings.hooks.UserPromptSubmit;
    if (!Object.keys(settings.hooks).length) delete settings.hooks;
  }

  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    if (fs.existsSync(p) && !fs.existsSync(`${p}.bak`)) fs.copyFileSync(p, `${p}.bak`); // keep the pristine original
    fs.writeFileSync(p, JSON.stringify(settings, null, 2) + '\n');
  } catch (e) { console.error(`failed to write ${p}: ${e.message}`); process.exitCode = 1; return; }

  if (values.json) { console.log(JSON.stringify({ enabled: sub === 'on', settings: p })); return; }
  console.log(`${green('✓')} autopilot ${sub === 'on' ? 'enabled' : 'disabled'}  ${dim(p)}`);
  if (sub === 'on') {
    console.log('\nHow it works: when what you ask lines up with a skill you don\'t have yet, Claude');
    console.log('quietly gets a shortlist and — only if one truly fits — explains it and offers a choice:');
    console.log(dim('  you:    "run a pre-mortem before we launch"'));
    console.log(dim('  claude: "that\'s exactly what the pre-mortem skill does — it stress-tests your plan'));
    console.log(dim('           before launch. use it now / see what it covers / skip?"'));
    console.log(dim('\nIt stays silent on greetings and generic asks, never repeats a skill, and Claude makes'));
    console.log(dim('the final call on relevance. Nothing leaves your machine.'));
    console.log(dim('\nneeds `skills-atlas` on PATH (npm i -g skills-atlas-cli).  turn off: skills-atlas hook off'));
  }
};
