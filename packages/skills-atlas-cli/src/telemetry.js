'use strict';
// Anonymous, opt-OUT CLI/plugin telemetry. No prompts/paths/skill bodies/identity/IP.
// Off when DO_NOT_TRACK is set, when the user ran `telemetry off`, or until the endpoint is
// configured. Non-blocking: events buffer and flush on exit via a DETACHED child (never awaited).
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

// Set BUILTIN_ENDPOINT to the deployed worker-analytics URL + '/event' BEFORE publishing to enable.
// Empty = inert (no notice, nothing sent). The env override exists for tests / power users.
const BUILTIN_ENDPOINT = '';
function endpoint() { return process.env.SKILLS_ATLAS_TELEMETRY_ENDPOINT || BUILTIN_ENDPOINT; }
const VERSION = require('../package.json').version;

const configDir = () => path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'skills-atlas');
const cfgFile = () => path.join(configDir(), 'telemetry.json');
const outboxDir = () => path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'skills-atlas', 'telemetry-outbox');

function readCfg() { try { return JSON.parse(fs.readFileSync(cfgFile(), 'utf8')); } catch { return null; } }
function writeCfg(c) { try { fs.mkdirSync(configDir(), { recursive: true }); fs.writeFileSync(cfgFile(), JSON.stringify(c, null, 2) + '\n'); } catch { /* ignore */ } }

function dnt() { const v = process.env.DO_NOT_TRACK; return v != null && v !== '' && v !== '0' && String(v).toLowerCase() !== 'false'; }

const NOTICE =
  '\n  Skills Atlas collects anonymous usage to improve the tool — commands run, which skills\n' +
  '  install, autopilot accept/skip, errors. No prompts, no paths, no identity, no IP.\n' +
  '  It is ON by default. Turn it off any time:  skills-atlas telemetry off   (or DO_NOT_TRACK=1)\n';

function state() {
  if (!endpoint() || dnt()) return { enabled: false, iid: null };
  let c = readCfg();
  if (!c) {
    c = { enabled: true, iid: crypto.randomBytes(8).toString('hex'), noticeShownAt: new Date().toISOString() };
    writeCfg(c);
    try { process.stderr.write(NOTICE); } catch { /* ignore */ }
  }
  return { enabled: c.enabled !== false, iid: c.iid };
}
function isEnabled() { return state().enabled; }
function setEnabled(on) {
  const c = readCfg() || { iid: crypto.randomBytes(8).toString('hex') };
  c.enabled = !!on; c.changedAt = new Date().toISOString();
  writeCfg(c);
  return c;
}

function osFamily() { const p = process.platform; return p === 'darwin' ? 'macos' : p === 'win32' ? 'windows' : p; }
function clientKind() { return process.env.CLAUDE_PLUGIN_ROOT ? 'plugin' : 'cli'; }

let buf = [], hooked = false;
function emit(type, fields) {
  const st = state();
  if (!st.enabled) return;
  buf.push(Object.assign({ type }, fields || {}, { iid: st.iid, ver: VERSION, os: osFamily() }));
  if (!hooked) { hooked = true; try { process.on('exit', () => _flushNow()); } catch { /* ignore */ } }
}

function _flushNow(opts) {
  if (!buf.length || !endpoint()) { buf = []; return; }
  const events = buf; buf = [];
  try {
    fs.mkdirSync(outboxDir(), { recursive: true });
    const file = path.join(outboxDir(), crypto.randomBytes(6).toString('hex') + '.json');
    fs.writeFileSync(file, JSON.stringify({ endpoint: endpoint(), client: clientKind(), events }));
    if (!opts || opts.spawn !== false) {
      const { spawn } = require('child_process');
      spawn(process.execPath, [path.join(__dirname, '..', 'bin', 'telemetry-send.js'), file], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch { /* never block exit */ }
}

module.exports = { emit, isEnabled, setEnabled, state, endpoint, configFile: cfgFile, NOTICE, _flushNow };
