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
const registry = require('../registry');
const prompt = require('../prompt');

const DEFAULT_MODEL = 'claude-haiku-4-5';
const MODEL_CHOICES = [
  ['claude-haiku-4-5', 'fast & cheap (default)'],
  ['claude-sonnet-4-6', 'balanced'],
  ['claude-opus-4-8', 'strongest, priciest'],
];

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
  if (values.help) { console.log('usage: skills-atlas hook <on|off|status|suggest on|off|gaps on|off|prune on|off|model [name]|lang en|zh>'); return; }
  const sub = positionals[0] || 'status';
  const p = settingsPath();

  // analysis model for the background gap/prune sub-agent. Accepts `hook model [name]`
  // and `hook gaps model [name]`; no name + a TTY → interactive picker.
  if (sub === 'model' || (sub === 'gaps' && positionals[1] === 'model')) {
    const arg = sub === 'model' ? positionals[1] : positionals[2];
    const cur = registry.getAutopilot().gapModel;
    let chosen = arg === 'default' ? DEFAULT_MODEL : arg;
    if (!arg) {
      if (!prompt.isInteractive()) { console.log(`gap/prune analysis model: ${cur}`); return; }
      const labels = [...MODEL_CHOICES.map(([m, d]) => `${m}   ${d}`), 'enter a custom model name…'];
      const i = await prompt.choose(`Which model runs the background gap/prune analysis?  (current: ${cur})`, labels);
      if (i < 0) { console.log('no change.'); return; }
      if (i === MODEL_CHOICES.length) {
        chosen = (await prompt.ask('model name> ')).trim();
        if (!chosen) { console.log('no change.'); return; }
      } else { chosen = MODEL_CHOICES[i][0]; }
    }
    registry.setAutopilot({ gapModel: chosen });
    console.log(`${green('✓')} gap/prune analysis model: ${chosen}`);
    return;
  }

  if (sub === 'lang') {
    const arg = positionals[1];
    if (!arg) { console.log(`autopilot reply language: ${registry.getAutopilot().replyLang}`); return; }
    if (arg !== 'en' && arg !== 'zh') { console.error('usage: skills-atlas hook lang <en|zh>'); process.exitCode = 1; return; }
    registry.setAutopilot({ replyLang: arg });
    console.log(`${green('✓')} autopilot reply language: ${arg === 'zh' ? '简体中文 (zh)' : 'English (en)'}`);
    return;
  }

  if (sub === 'suggest' || sub === 'gaps' || sub === 'prune') {
    const onoff = positionals[1];
    if (onoff !== 'on' && onoff !== 'off') {
      console.error(`usage: skills-atlas hook ${sub} <on|off>`); process.exitCode = 1; return;
    }
    const key = sub === 'suggest' ? 'suggest' : sub === 'gaps' ? 'gapAlerts' : 'prune';
    registry.setAutopilot({ [key]: onoff === 'on' });
    const label = sub === 'suggest' ? 'per-prompt autopilot' : sub === 'gaps' ? 'gap alerts' : 'prune suggestions';
    console.log(`${green('✓')} ${label}: ${onoff === 'on' ? green('on') : dim('off')}`);
    return;
  }

  if (sub === 'status') {
    let settingsHook = false;
    try { settingsHook = ((readSettings(p).hooks || {}).UserPromptSubmit || []).some(isOurs); } catch { /* invalid → treat as none */ }
    const ap = registry.getAutopilot();
    const on = ap.enabled !== false;
    if (values.json) { console.log(JSON.stringify({ enabled: on, settingsHook, suggest: ap.suggest, gapAlerts: ap.gapAlerts, prune: ap.prune, gapModel: ap.gapModel, replyLang: ap.replyLang, settings: p })); return; }
    console.log(`autopilot: ${on ? green('on') : dim('off')}   ${dim('(skills-atlas hook on|off — on by default)')}`);
    console.log(dim(`  hook source: ${settingsHook ? 'settings.json' : 'the plugin (or run `skills-atlas hook on` if you use the CLI without the plugin)'}`));
    console.log(`  per-prompt suggest: ${ap.suggest ? green('on') : dim('off')}   ${dim('(skills-atlas hook suggest on|off)')}`);
    console.log(`  gap alerts:         ${ap.gapAlerts ? green('on') : dim('off')}   ${dim('(skills-atlas hook gaps on|off)')}`);
    console.log(`  prune suggestions:  ${ap.prune ? green('on') : dim('off')}   ${dim('(skills-atlas hook prune on|off)')}`);
    console.log(`  analysis model:     ${dim(ap.gapModel)}   ${dim('(skills-atlas hook model)')}`);
    console.log(`  reply language:     ${dim(ap.replyLang)}   ${dim('(skills-atlas hook lang en|zh)')}`);
    console.log(dim('  review: skills-atlas gaps  ·  skills-atlas prune'));
    return;
  }

  if (sub !== 'on' && sub !== 'off') {
    console.error('usage: skills-atlas hook <on|off|status|suggest on|off|gaps on|off>');
    process.exitCode = 1;
    return;
  }

  let settings, changed = false;
  try { settings = readSettings(p); }
  catch (e) { console.error(`${p} is not valid JSON — fix it first (${e.message}).`); process.exitCode = 1; return; }

  // Master switch first: it gates the autopilot whether the hook is shipped by the
  // plugin or registered here in settings.json. Default is ON.
  registry.setAutopilot({ enabled: sub === 'on' });

  // Keep settings.json in sync so CLI-only users (no plugin) get the hook registered /
  // removed. Plugin users already have the hook; the identical command string is
  // de-duplicated by Claude Code, so there is no double-fire. Coerce defensively.
  if (!settings.hooks || typeof settings.hooks !== 'object' || Array.isArray(settings.hooks)) settings.hooks = {};
  const arr = Array.isArray(settings.hooks.UserPromptSubmit) ? settings.hooks.UserPromptSubmit : [];
  if (sub === 'on' && !arr.some(isOurs)) {
    settings.hooks.UserPromptSubmit = [...arr, { matcher: '*', hooks: [{ type: 'command', command: HOOK_CMD, timeout: 5 }] }];
    changed = true;
  } else if (sub === 'off' && arr.some(isOurs)) {
    const kept = arr.filter(e => !isOurs(e));
    if (kept.length) settings.hooks.UserPromptSubmit = kept;
    else delete settings.hooks.UserPromptSubmit;
    if (!Object.keys(settings.hooks).length) delete settings.hooks;
    changed = true;
  }

  if (changed) {
    try {
      fs.mkdirSync(path.dirname(p), { recursive: true });
      if (fs.existsSync(p) && !fs.existsSync(`${p}.bak`)) fs.copyFileSync(p, `${p}.bak`); // keep the pristine original
      // Removing our only setting? Don't leave a bare `{}` behind — drop the file.
      if (sub === 'off' && !Object.keys(settings).length && fs.existsSync(p)) fs.rmSync(p, { force: true });
      else fs.writeFileSync(p, JSON.stringify(settings, null, 2) + '\n');
    } catch (e) { console.error(`failed to write ${p}: ${e.message}`); process.exitCode = 1; return; }
  }

  if (values.json) { console.log(JSON.stringify({ enabled: sub === 'on', settings: p })); return; }
  console.log(`${green('✓')} autopilot ${sub === 'on' ? green('on') : dim('off')}`);
  if (sub === 'on') {
    console.log(dim('  (on by default once the plugin is installed; this also registers the CLI hook for non-plugin use.)'));
    console.log('\nHow it works: when what you ask lines up with a skill you don\'t have yet, Claude');
    console.log('quietly gets a shortlist and — only if one truly fits — explains it and offers a choice:');
    console.log(dim('  you:    "run a pre-mortem before we launch"'));
    console.log(dim('  claude: "that\'s exactly what the pre-mortem skill does — it stress-tests your plan'));
    console.log(dim('           before launch. use it now / see what it covers / skip?"'));
    console.log(dim('\nIt stays silent on greetings and generic asks, never repeats a skill, and Claude makes'));
    console.log(dim('the final call on relevance. Nothing leaves your machine.'));
    console.log(dim('\nneeds `skills-atlas` on PATH (npm i -g skills-atlas-cli).  turn off: skills-atlas hook off'));
  } else {
    console.log(dim('  the autopilot stays silent (the plugin hook, if installed, no-ops).  turn back on: skills-atlas hook on'));
  }
};
