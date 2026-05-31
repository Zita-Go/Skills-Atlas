// Data loading + caching for the Skills Atlas catalog.
//
// Offline-first: normal commands (search/info/install) never hit the network —
// they read a refreshed cache if present, otherwise the bundled snapshot. Only
// `update` fetches from the public URL.
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

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

function isValid(d) {
  return d && Array.isArray(d.sections) && d.vendors && typeof d.vendors === 'object';
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

// One-line stderr nudge when the catalog is the bundled snapshot or a stale cache.
function maybeStaleNudge(fromCache) {
  const meta = tryReadJSON(metaFile());
  let stale = true;
  if (fromCache && meta && meta.fetchedAt) {
    const ageDays = (Date.now() - Date.parse(meta.fetchedAt)) / 86400000;
    stale = !(ageDays >= 0 && ageDays < STALE_DAYS);
  }
  if (stale) {
    process.stderr.write("tip: run 'skills-atlas update' to refresh the catalog\n");
  }
}

function loadData({ quiet = false } = {}) {
  const cached = tryReadJSON(cacheFile());
  if (isValid(cached)) {
    if (!quiet) maybeStaleNudge(true);
    return { data: cached, source: 'cache', fromCache: true };
  }
  const b = loadBundled();
  if (!quiet) maybeStaleNudge(false);
  return { ...b, fromCache: false };
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

module.exports = { loadData, refreshData, counts, cacheDir, PUBLIC_URL };
