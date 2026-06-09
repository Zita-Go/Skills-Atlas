#!/usr/bin/env node
'use strict';
// Detached sender. Reads {endpoint, client, events} from the temp file in argv[2], POSTs once
// with a short timeout, then deletes the file. Fully fail-silent — telemetry must never matter.
const fs = require('fs');
const file = process.argv[2];
const cleanup = () => { try { fs.unlinkSync(file); } catch { /* ignore */ } };
if (!file) process.exit(0);
let p; try { p = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { cleanup(); process.exit(0); }
if (!p || !p.endpoint || !Array.isArray(p.events) || !p.events.length) { cleanup(); process.exit(0); }
try {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 2000);
  fetch(p.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client: p.client, events: p.events }),
    signal: ac.signal,
  }).catch(() => {}).finally(() => { clearTimeout(timer); cleanup(); });
} catch { cleanup(); }
