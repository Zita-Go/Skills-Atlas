// Private catalog sources ("registry"): user config + per-source local cache, so
// an org can point the CLI at its own data.json alongside the public Atlas.
// Self-contained (own XDG path helpers) to avoid a require cycle with data.js.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

function configDir() {
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(base, 'skills-atlas');
}
const configFile = () => path.join(configDir(), 'config.json');

function cacheDir() {
  const base = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(base, 'skills-atlas');
}
const sourcesDir = () => path.join(cacheDir(), 'sources');

function readConfig() {
  try {
    const c = JSON.parse(fs.readFileSync(configFile(), 'utf8'));
    if (!Array.isArray(c.sources)) c.sources = [];
    return c;
  } catch { return { version: 1, sources: [] }; }
}
function writeConfig(c) {
  fs.mkdirSync(configDir(), { recursive: true });
  fs.writeFileSync(configFile(), JSON.stringify(c, null, 2) + '\n');
}
function addSource(url, opts = {}) {
  const c = readConfig();
  const existing = c.sources.find(s => s.url === url);
  if (existing) { if (opts.name) existing.name = opts.name; }
  else c.sources.push({ url, name: opts.name || null, addedAt: new Date().toISOString() });
  writeConfig(c);
}
function removeSource(url) {
  const c = readConfig();
  const before = c.sources.length;
  c.sources = c.sources.filter(s => s.url !== url);
  writeConfig(c);
  return c.sources.length < before;
}
const listSources = () => readConfig().sources;

const envSources = () => (process.env.SKILLS_ATLAS_SOURCES || '')
  .split(',').map(s => s.trim()).filter(Boolean);

function effectiveSources() {
  const out = [], seen = new Set();
  for (const s of listSources()) if (s.url && !seen.has(s.url)) { seen.add(s.url); out.push({ url: s.url, name: s.name || null }); }
  for (const u of envSources()) if (!seen.has(u)) { seen.add(u); out.push({ url: u, name: null }); }
  return out;
}

function sourceCachePath(url) {
  const h = crypto.createHash('sha1').update(url).digest('hex').slice(0, 16);
  return path.join(sourcesDir(), `${h}.json`);
}
function cacheSource(url, dataObj) {
  fs.mkdirSync(sourcesDir(), { recursive: true });
  fs.writeFileSync(sourceCachePath(url), JSON.stringify(dataObj));
}
function readCachedSource(url) {
  try { return JSON.parse(fs.readFileSync(sourceCachePath(url), 'utf8')); } catch { return null; }
}
function removeCachedSource(url) {
  try { fs.rmSync(sourceCachePath(url), { force: true }); } catch { /* ignore */ }
}

module.exports = {
  configDir, configFile, readConfig, writeConfig, addSource, removeSource, listSources,
  effectiveSources, sourceCachePath, cacheSource, readCachedSource, removeCachedSource,
};
