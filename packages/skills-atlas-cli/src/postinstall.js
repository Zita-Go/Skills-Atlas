'use strict';
// npm `postinstall`: print a short getting-started note the moment `npm i -g
// skills-atlas-cli` finishes — immediate terminal confirmation, with no Claude session or
// prompt needed. Only on GLOBAL (`-g`) installs (the user-facing case); skipped for
// local/dev/CI installs. MUST never fail an install — everything is wrapped and it always
// exits 0.
try {
  if (process.env.npm_config_global === 'true' && !process.env.CI) {
    let v = '';
    try { v = require('../package.json').version; } catch { /* ignore */ }
    const tty = process.stdout.isTTY;
    const g = s => (tty ? `\x1b[32m${s}\x1b[0m` : s);
    const b = s => (tty ? `\x1b[1m${s}\x1b[0m` : s);
    const dim = s => (tty ? `\x1b[2m${s}\x1b[0m` : s);
    process.stdout.write([
      '',
      `✨ ${b('Skills Atlas')}${v ? ' v' + v : ''} installed — the engine behind the Skills Atlas plugin for Claude Code.`,
      '',
      '   Quick start',
      `     ${g('skills-atlas search')} <query>    find a ready-made agent skill`,
      `     ${g('skills-atlas setup')}              status & settings`,
      '',
      dim("   In a Claude Code session right now? It's live — the plugin greets you on your next message."),
      '',
    ].join('\n') + '\n');
  }
} catch { /* never break an install */ }
