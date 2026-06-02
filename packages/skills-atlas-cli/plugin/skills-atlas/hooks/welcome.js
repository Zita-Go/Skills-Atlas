#!/usr/bin/env node
'use strict';
// SessionStart handler bundled in the plugin (run via `node ${CLAUDE_PLUGIN_ROOT}/hooks/
// welcome.js`). If the `skills-atlas` engine is installed, it delegates to the CLI's
// one-time welcome (`setup --session-start`). If the CLI isn't on PATH yet, it shows the
// "install the engine" notice (once per session, via engine-nudge) and does NOT mark the
// user onboarded — so the real welcome ("Nicely done…") still fires once they install it.
//
// Only greet on fresh-screen moments — `startup` and `clear`. Skip `resume`/`compact`, which
// happen mid-work and would silently consume the one-shot welcome before the user sees it.
const fs = require('fs');
const { spawnSync } = require('child_process');
const nudgeEngine = require('./engine-nudge');

let event = {};
try { event = JSON.parse(fs.readFileSync(0, 'utf8')); } catch { /* no event → fresh start */ }
const source = String(event.source || '').toLowerCase();
if (source === 'resume' || source === 'compact') process.exit(0);

// CLI present → it prints its own one-time welcome (inherited stdout). Missing → ENOENT.
const r = spawnSync('skills-atlas', ['setup', '--session-start'], { stdio: ['ignore', 'inherit', 'inherit'] });
if (r.error && r.error.code === 'ENOENT') nudgeEngine(event.session_id, 'SessionStart');
// CLI present (no r.error): it already emitted (or stayed silent). Any other spawn error:
// stay silent (fail-open; never block session start).
