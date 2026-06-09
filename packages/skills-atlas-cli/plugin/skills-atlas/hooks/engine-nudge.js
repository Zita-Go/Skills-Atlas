'use strict';
// Shared by the plugin's two hooks (welcome.js = SessionStart, prompt-hook.js =
// UserPromptSubmit). When the `skills-atlas` CLI isn't on PATH yet, surface the "install the
// engine" notice ONCE PER SESSION (keyed on the session id) — so the user is reliably told
// how to finish setup (even if they added the plugin mid-session and no SessionStart fired),
// without being nagged on every prompt. Self-contained: it must work WITHOUT the CLI, since
// the CLI is the very thing that's missing.
const fs = require('fs');
const os = require('os');
const path = require('path');

const cacheDir = () => path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'skills-atlas');

// Emit the install nudge unless this session already got it. Returns true if it emitted.
module.exports = function nudgeEngine(sessionId, hookEventName) {
  const dir = cacheDir();
  const sid = String(sessionId || 'nosession').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const marker = path.join(dir, 'engine-nudge', sid);
  try { if (fs.existsSync(marker)) return false; } catch { /* ignore */ }
  try { fs.mkdirSync(path.dirname(marker), { recursive: true }); fs.writeFileSync(marker, '1'); } catch { /* ignore */ }
  // Remember the install prompt was shown, so the eventual welcome reads "Nicely done".
  try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'install-prompt-shown'), new Date().toISOString() + '\n'); } catch { /* ignore */ }
  const msg = "⚡️ Almost there! The plugin's installed; it just needs its engine. " +
    'Run npm i -g skills-atlas-cli (Node 18+) and Skills Atlas comes alive.';
  try { require('./hook-telemetry')('engine_missing'); } catch { /* ignore */ }
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName }, systemMessage: msg, suppressOutput: true }));
  return true;
};
