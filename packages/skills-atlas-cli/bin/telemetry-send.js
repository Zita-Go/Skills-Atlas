#!/usr/bin/env node
'use strict';
// Detached sender. Reads {endpoint, client, events} from the temp file in argv[2], POSTs once,
// then deletes the file. Fully fail-silent — telemetry must never matter.
// In a proxied environment Node's built-in fetch (undici) IGNORES *_PROXY env, so the POST would
// silently fail; there we fall back to curl, which honors the proxy. Non-proxied → plain fetch.
const fs = require('fs');
const file = process.argv[2];
const cleanup = () => { try { fs.unlinkSync(file); } catch { /* ignore */ } };
if (!file) process.exit(0);
let p; try { p = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { cleanup(); process.exit(0); }
if (!p || !p.endpoint || !Array.isArray(p.events) || !p.events.length) { cleanup(); process.exit(0); }

const body = JSON.stringify({ client: p.client, events: p.events });
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY ||
              process.env.http_proxy || process.env.ALL_PROXY || process.env.all_proxy;

if (proxy) {
  // curl picks up *_PROXY from the environment automatically; body via stdin avoids arg limits.
  try {
    require('child_process').spawnSync('curl', [
      '-s', '--max-time', '4', '-X', 'POST', p.endpoint,
      '-H', 'Content-Type: application/json', '--data-binary', '@-',
    ], { input: body, stdio: ['pipe', 'ignore', 'ignore'] });
  } catch { /* curl missing → drop; telemetry must never matter */ }
  cleanup();
  process.exit(0);
}

try {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 2000);
  fetch(p.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: ac.signal,
  }).catch(() => {}).finally(() => { clearTimeout(timer); cleanup(); });
} catch { cleanup(); }
