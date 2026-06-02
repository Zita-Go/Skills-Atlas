#!/usr/bin/env node
'use strict';
// SessionStart handler bundled in the plugin (run via `node ${CLAUDE_PLUGIN_ROOT}/hooks/
// welcome.js`). It delegates to the real CLI's one-time welcome when the `skills-atlas`
// engine is installed; if the CLI isn't on PATH, it shows a friendly "install the engine"
// notice (verbatim, via systemMessage) and does NOT mark the user onboarded — so the real
// welcome ("Nicely done…") still fires the first session AFTER they install the CLI.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

// CLI present → it prints its own one-time welcome (inherited stdout). Missing → ENOENT.
const r = spawnSync('skills-atlas', ['setup', '--session-start'], { stdio: 'inherit' });

if (r.error && r.error.code === 'ENOENT') {
  // Remember the install prompt was shown, so the eventual welcome reads "Nicely done".
  try {
    const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
    const f = path.join(base, 'skills-atlas', 'install-prompt-shown');
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, new Date().toISOString() + '\n');
  } catch { /* best-effort */ }
  const msg = "⚡️ Almost there! The plugin's installed; it just needs its engine. " +
    'Run npm i -g skills-atlas-cli (Node 18+) and Skills Atlas comes alive.';
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart' }, systemMessage: msg, suppressOutput: true }));
}
// CLI present (no r.error): it already emitted the welcome — nothing to add. Any other
// spawn error: stay silent (fail-open; never block session start).
