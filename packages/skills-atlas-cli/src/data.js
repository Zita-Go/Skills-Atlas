// Data loading + caching for the Skills Atlas catalog.
//
// Offline-first: normal commands (search/info/install) never hit the network —
// they read a refreshed cache if present, otherwise the bundled snapshot. Only
// `update` fetches from the public URL.
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const registry = require('./registry');
const { mergeCatalogs } = require('./merge');

const PUBLIC_URL = 'https://zita-go.github.io/Skills-Atlas/data.json';
const UA = 'skills-atlas-cli';
const STALE_DAYS = 30;

function cacheDir() {
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(base, 'skills-atlas');
}
const cacheFile = () => path.join(cacheDir(), 'data.json');
const metaFile = () => path.join(cacheDir(), 'meta.json');

function tryReadJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

// Structural validation, not just "has the two top keys". The catalog is iterated
// as sections[].subsections[].rows[] everywhere (counts/merge/search), so a source
// missing that shape (e.g. an old `subgroups`/`groups` schema) must be rejected
// HERE — both to fail `registry add` cleanly and to keep a stale bad cache from
// being merged as an overlay and crashing every downstream command.
function isValid(d) {
  return !!d
    && Array.isArray(d.sections)
    && d.sections.every(s => s && Array.isArray(s.subsections)
      && s.subsections.every(ss => ss && Array.isArray(ss.rows)))
    && !!d.vendors && typeof d.vendors === 'object';
}

function counts(d) {
  const groups = d.sections.reduce(
    (n, s) => n + s.subsections.reduce((m, ss) => m + ss.rows.length, 0), 0);
  return { sections: d.sections.length, groups, vendors: Object.keys(d.vendors).length };
}

// Resolve the bundled (offline) snapshot. Works when published (own ./data.json
// shipped in `files`) and in the monorepo during dev (sibling data package or
// the canonical docs/data.json), so it never hard-fails before `npm run build`.
function loadBundled() {
  const candidates = [
    path.join(__dirname, '..', 'data.json'),                         // copied by build.js
    path.join(__dirname, '..', '..', 'skills-atlas-data', 'data.json'), // sibling package (dev)
    path.join(__dirname, '..', '..', '..', 'docs', 'data.json'),     // canonical (dev)
  ];
  for (const p of candidates) {
    const d = tryReadJSON(p);
    if (isValid(d)) return { data: d, source: p };
  }
  try {
    const d = require('skills-atlas-data'); // npm dependency, if installed
    if (isValid(d)) return { data: d, source: 'skills-atlas-data' };
  } catch { /* not installed */ }
  throw new Error(
    'No Skills Atlas data found. Run `npm run build` in packages/skills-atlas-cli, ' +
    'or run `skills-atlas update` to fetch the catalog.');
}

const nudgeFile = () => path.join(cacheDir(), 'nudge.json');

// One-line stderr nudge when the catalog is the bundled snapshot or a stale cache.
// Throttled to once per day so it informs without nagging on every command.
function maybeStaleNudge(fromCache) {
  const meta = tryReadJSON(metaFile());
  let stale = true;
  if (fromCache && meta && meta.fetchedAt) {
    const ageDays = (Date.now() - Date.parse(meta.fetchedAt)) / 86400000;
    stale = !(ageDays >= 0 && ageDays < STALE_DAYS);
  }
  if (!stale) return;
  try {
    const n = tryReadJSON(nudgeFile());
    if (n && n.at && (Date.now() - Date.parse(n.at)) < 86400000) return; // shown within the day
    fs.mkdirSync(cacheDir(), { recursive: true });
    fs.writeFileSync(nudgeFile(), JSON.stringify({ at: new Date().toISOString() }));
  } catch { /* throttle I/O is best-effort */ }
  process.stderr.write("tip: run 'skills-atlas update' to refresh the catalog\n");
}

const REFRESH_AFTER_MS = 24 * 3600000; // auto-refresh once the cache is a day old
const refreshStampFile = () => path.join(cacheDir(), 'autorefresh.json');

// Pure decision: should we kick off a background refresh now? (cache stale/absent,
// not throttled, not opted out). Injectable for tests.
function shouldAutoRefresh({ meta, stamp, env, now }) {
  if (env.SKILLS_ATLAS_NO_REFRESH || env.SKILLS_ATLAS_OFFLINE || env.SKILLS_ATLAS_BG_REFRESH) return false;
  const t = meta && meta.fetchedAt ? Date.parse(meta.fetchedAt) : NaN;
  const ageMs = Number.isFinite(t) ? now - t : Infinity;       // absent/bad meta → treat as stale
  if (ageMs < REFRESH_AFTER_MS) return false;
  const st = stamp && stamp.at ? Date.parse(stamp.at) : NaN;
  if (Number.isFinite(st) && (now - st) < REFRESH_AFTER_MS) return false; // already tried today
  return true;
}

// Fire-and-forget: if the catalog is old (or absent) and we haven't tried today,
// spawn a DETACHED background `update` so new skills appear next time. Never blocks,
// never errors out. Opt out with SKILLS_ATLAS_NO_REFRESH / SKILLS_ATLAS_OFFLINE.
function maybeBackgroundRefresh() {
  try {
    if (!shouldAutoRefresh({ meta: tryReadJSON(metaFile()), stamp: tryReadJSON(refreshStampFile()), env: process.env, now: Date.now() })) return;
    ensureDir(cacheDir());
    fs.writeFileSync(refreshStampFile(), JSON.stringify({ at: new Date().toISOString() })); // stamp first → no double-spawn
    const { spawn } = require('child_process');
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'bin', 'skills.js'), 'update'], {
      detached: true, stdio: 'ignore', env: { ...process.env, SKILLS_ATLAS_BG_REFRESH: '1' },
    });
    child.unref();
  } catch { /* fully fail-silent — never affect the foreground command */ }
}

function loadData({ quiet = false } = {}) {
  const cached = tryReadJSON(cacheFile());
  let base, info;
  if (isValid(cached)) { base = cached; info = { source: 'cache', fromCache: true }; if (!quiet) maybeStaleNudge(true); }
  else { const b = loadBundled(); base = b.data; info = { source: b.source, fromCache: false }; if (!quiet) maybeStaleNudge(false); }

  const overlays = registry.effectiveSources()
    .map(s => registry.readCachedSource(s.url))
    .filter(isValid);
  if (!overlays.length) return { data: base, ...info };
  return { data: mergeCatalogs(base, overlays), source: `${info.source}+${overlays.length}private`, fromCache: info.fromCache };
}

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

// Fetch the public catalog and atomically replace the cache. Never corrupts the
// existing cache on failure (validate + tmp-then-rename).
async function refreshData() {
  const meta = tryReadJSON(metaFile()) || {};
  const headers = { 'User-Agent': UA, Accept: 'application/json' };
  if (meta.etag) headers['If-None-Match'] = meta.etag;

  const prev = tryReadJSON(cacheFile());
  let res;
  const ac = new AbortController();
  const timeoutMs = Number(process.env.SKILLS_ATLAS_TIMEOUT_MS) || 25000;
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    res = await fetch(PUBLIC_URL, { headers, signal: ac.signal });
  } catch (e) {
    throw new Error(e.name === 'AbortError'
      ? `timed out after ${timeoutMs}ms fetching catalog`
      : `network error fetching catalog: ${e.message}`);
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 304 && isValid(prev)) {
    return { changed: false, counts: counts(prev), url: PUBLIC_URL };
  }
  if (!res.ok) {
    throw new Error(`fetch failed: HTTP ${res.status} ${res.statusText} (${PUBLIC_URL})`);
  }

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('downloaded catalog is not valid JSON; kept existing cache');
  }
  if (!isValid(data)) {
    throw new Error('downloaded catalog missing sections/vendors; kept existing cache');
  }

  ensureDir(cacheDir());
  const tmp = cacheFile() + '.tmp';
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, cacheFile());
  fs.writeFileSync(metaFile(), JSON.stringify({
    fetchedAt: new Date().toISOString(),
    etag: res.headers.get('etag') || null,
    sourceUrl: PUBLIC_URL,
    counts: counts(data),
  }, null, 2));

  return {
    changed: true,
    counts: counts(data),
    prevCounts: isValid(prev) ? counts(prev) : null,
    url: PUBLIC_URL,
  };
}

// Fetch (or read, for a local path / file:// URL) a private catalog source and
// validate it. Honors SKILLS_ATLAS_TOKEN (Bearer) and SKILLS_ATLAS_TIMEOUT_MS.
async function fetchSource(src) {
  if (!/^https?:\/\//i.test(src)) {                  // local file path or file:// URL
    const p = src.replace(/^file:\/\//, '');
    let d;
    try { d = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { throw new Error(`${src}: ${e.message}`); }
    if (!isValid(d)) throw new Error(`${src}: not a valid catalog (sections/vendors)`);
    return d;
  }
  const headers = { 'User-Agent': UA, Accept: 'application/json' };
  if (process.env.SKILLS_ATLAS_TOKEN) headers.Authorization = `Bearer ${process.env.SKILLS_ATLAS_TOKEN}`;
  const ac = new AbortController();
  const timeoutMs = Number(process.env.SKILLS_ATLAS_TIMEOUT_MS) || 25000;
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  let res;
  try { res = await fetch(src, { headers, signal: ac.signal }); }
  catch (e) { throw new Error(e.name === 'AbortError' ? `timed out fetching ${src}` : `network error fetching ${src}: ${e.message}`); }
  finally { clearTimeout(timer); }
  if (!res.ok) throw new Error(`fetch failed: HTTP ${res.status} ${res.statusText} (${src})`);
  let d;
  try { d = JSON.parse(await res.text()); } catch { throw new Error(`${src}: not valid JSON`); }
  if (!isValid(d)) throw new Error(`${src}: not a valid catalog (sections/vendors)`);
  return d;
}

// Refresh every configured private source into its local cache (best-effort).
async function refreshSources() {
  const out = [];
  for (const s of registry.effectiveSources()) {
    try { const d = await fetchSource(s.url); registry.cacheSource(s.url, d); out.push({ url: s.url, ok: true, counts: counts(d) }); }
    catch (e) { out.push({ url: s.url, ok: false, error: e.message }); }
  }
  return out;
}

module.exports = { loadData, refreshData, fetchSource, refreshSources, counts, isValid, shouldAutoRefresh, maybeBackgroundRefresh, cacheDir, PUBLIC_URL };
