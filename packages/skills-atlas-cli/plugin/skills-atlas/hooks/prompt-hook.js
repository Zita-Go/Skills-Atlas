#!/usr/bin/env node
'use strict';
// UserPromptSubmit fallback, run by hooks.json ONLY when the `skills-atlas` CLI is NOT on
// PATH (the hook command runs `skills-atlas suggest` directly when it IS present). Here the
// engine is missing, so we can't run the autopilot — instead nudge the user to install it,
// once per session (shared marker with welcome.js), so they're told even when the plugin was
// added mid-session and no SessionStart fired. Self-contained: works without the CLI.
const fs = require('fs');
const nudgeEngine = require('./engine-nudge');

let sid;
try { sid = JSON.parse(fs.readFileSync(0, 'utf8')).session_id; } catch { /* no event */ }
nudgeEngine(sid, 'UserPromptSubmit');
