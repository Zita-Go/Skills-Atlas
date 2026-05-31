// GitHub access for installing skills.
//
// Primary path: download the repo archive from codeload.github.com (NOT subject
// to the 60-req/h REST API limit) and extract only the skill's folder — so a
// normal install costs ZERO GitHub-API requests. Fallback: the GitHub tree API
// + raw.githubusercontent.com per file (used when codeload is unreachable).
// Pure Node fetch + built-in zlib, no git binary, no dependencies.
'use strict';

const path = require('path');
const zlib = require('zlib');

const UA = 'skills-atlas-cli';
const TIMEOUT_MS = Number(process.env.SKILLS_ATLAS_TIMEOUT_MS) || 25000;

function ghHeaders() {
  const h = { 'User-Agent': UA, Accept: 'application/vnd.github+json' };
  const tok = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (tok) h.Authorization = `Bearer ${tok}`;
  return h;
}

// fetch with a hard timeout so a stalled connection never hangs the CLI.
async function fetchT(url, opts = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opts, signal: ac.signal });
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`timed out after ${TIMEOUT_MS}ms: ${url}`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

const encPath = p => p.split('/').map(encodeURIComponent).join('/');

async function fetchTree(author, repo, branch) {
  const url = `https://api.github.com/repos/${author}/${repo}/git/trees/${branch}?recursive=1`;
  let res;
  try {
    res = await fetchT(url, { headers: ghHeaders() });
  } catch (e) {
    throw new Error(`network error reaching GitHub: ${e.message}`);
  }
  if (res.status === 403 || res.status === 429) {
    if (res.headers.get('x-ratelimit-remaining') === '0') {
      const reset = Number(res.headers.get('x-ratelimit-reset') || 0) * 1000;
      const when = reset ? new Date(reset).toLocaleTimeString() : 'soon';
      const e = new Error(
        `GitHub API rate limit reached (resets ~${when}). ` +
        `Set GITHUB_TOKEN to raise the limit to 5000/h.`);
      e.code = 'RATE_LIMIT';
      throw e;
    }
  }
  if (res.status === 404) {
    const e = new Error(`not found: ${author}/${repo}@${branch}`);
    e.code = 'NOT_FOUND';
    throw e;
  }
  if (!res.ok) throw new Error(`GitHub API HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

// Fetch one file's bytes. Primary: raw.githubusercontent.com (no API budget).
// Fallback: GitHub Contents API with the `raw` media type (works in networks
// where raw.githubusercontent.com is blocked; counts against the API limit).
async function fetchRaw(author, repo, branch, p) {
  const rawUrl = `https://raw.githubusercontent.com/${author}/${repo}/${branch}/${encodeURI(p)}`;
  try {
    const res = await fetchT(rawUrl, { headers: { 'User-Agent': UA } });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  } catch { /* fall back to the API */ }

  const apiUrl = `https://api.github.com/repos/${author}/${repo}/contents/${encPath(p)}?ref=${encodeURIComponent(branch)}`;
  const res2 = await fetchT(apiUrl, { headers: { ...ghHeaders(), Accept: 'application/vnd.github.raw' } });
  if (!res2.ok) throw new Error(`fetch failed (raw + API, HTTP ${res2.status}) for ${p}`);
  return Buffer.from(await res2.arrayBuffer());
}

// Resolve the list of files that make up a skill folder.
// docPath e.g. "skills/brainstorming/SKILL.md" or "pm-execution/skills/x/SKILL.md".
// Returns { files: [{ path, rel }], branchUsed, truncated, note }.
async function listSkillFiles({ author, repo, branch, docPath }) {
  const folderPath = path.posix.dirname(docPath);

  // Root-level SKILL.md => the "folder" is the repo root; never pull the whole
  // repo — just take the SKILL.md so install stays a single, safe file.
  if (folderPath === '.' || folderPath === '') {
    return {
      files: [{ path: docPath, rel: path.posix.basename(docPath) }],
      branchUsed: branch || 'main',
      truncated: false,
      note: 'root-level SKILL.md — installed the file only',
    };
  }

  let branchUsed = branch || 'main';
  let tree;
  try {
    tree = await fetchTree(author, repo, branchUsed);
  } catch (e) {
    if (e.code === 'NOT_FOUND' && branchUsed !== 'master') {
      branchUsed = 'master';
      tree = await fetchTree(author, repo, branchUsed); // may throw again
    } else {
      throw e;
    }
  }

  const prefix = folderPath.endsWith('/') ? folderPath : folderPath + '/';
  let blobs = (tree.tree || []).filter(
    t => t.type === 'blob' && (t.path === docPath || t.path.startsWith(prefix)));

  let note = null;
  if (blobs.length === 0) {
    // Huge repo with a truncated tree, or the path moved. Fall back to the
    // single SKILL.md so the install still yields the skill doc.
    note = tree.truncated
      ? 'repo tree truncated — installed SKILL.md only, supporting files may be missing'
      : 'folder not found in tree — installed SKILL.md only';
    blobs = [{ path: docPath }];
  }

  const files = blobs.map(b => ({ path: b.path, rel: b.path.slice(prefix.length) }));
  return { files, branchUsed, truncated: !!tree.truncated, note };
}

// --- archive (codeload) path: extract one folder from a repo .tar.gz, no API ---

// Minimal tar reader (zero deps). Walks 512-byte blocks of a gunzipped tar and
// returns regular files whose in-repo path is under `folderPath/`, with their
// path *inside* that folder. Handles ustar prefix + GNU 'L' and pax 'path='
// long names (GitHub archives use these for paths > 100 chars).
function extractTarGz(gzBuf, folderPath) {
  const tar = zlib.gunzipSync(gzBuf);
  const prefix = folderPath.endsWith('/') ? folderPath : folderPath + '/';
  const out = [];
  let off = 0, longName = null;
  const str = (h, o, len) => h.toString('utf8', o, o + len).replace(/\0.*$/, '');

  while (off + 512 <= tar.length) {
    const h = tar.subarray(off, off + 512);
    off += 512;
    if (h.every(b => b === 0)) break; // end-of-archive

    let name = str(h, 0, 100);
    const pfx = str(h, 345, 155);
    if (pfx) name = pfx + '/' + name;
    if (longName != null) { name = longName; longName = null; }

    const size = parseInt(str(h, 124, 12).trim() || '0', 8) || 0;
    const type = h[156];
    const data = tar.subarray(off, off + size);
    off += Math.ceil(size / 512) * 512;

    if (type === 0x4c) { // 'L' GNU long name → name of the NEXT entry
      longName = data.toString('utf8').replace(/\0.*$/, '');
      continue;
    }
    if (type === 0x78 || type === 0x67) { // 'x'/'g' pax header → "path=" record
      for (const line of data.toString('utf8').split('\n')) {
        const m = line.match(/^\d+ path=(.*)$/);
        if (m) { longName = m[1]; break; }
      }
      continue;
    }
    if (type !== 0x30 && type !== 0x00) continue; // only regular files ('0'/NUL)

    // strip the leading "<repo>-<ref>/" archive prefix → in-repo path
    const slash = name.indexOf('/');
    if (slash < 0) continue;
    const inRepo = name.slice(slash + 1);
    if (inRepo.startsWith(prefix)) {
      out.push({ rel: inRepo.slice(prefix.length), data: Buffer.from(data) });
    }
  }
  return out;
}

// One archive per repo@ref per process — so installing a whole chain (many
// skills from one repo) downloads the archive ONCE.
const _archiveCache = new Map();
async function fetchArchive(author, repo, ref) {
  const key = `${author}/${repo}@${ref}`;
  if (_archiveCache.has(key)) return _archiveCache.get(key);
  const url = `https://codeload.github.com/${author}/${repo}/tar.gz/${ref}`;
  const res = await fetchT(url, { headers: { 'User-Agent': UA } });
  if (res.status === 404) { const e = new Error(`archive not found: ${ref}`); e.code = 'NOT_FOUND'; throw e; }
  if (!res.ok) throw new Error(`codeload HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  _archiveCache.set(key, buf);
  return buf;
}

// Resolve a skill's folder via the repo archive. Returns { files:[{rel,data}],
// branchUsed, source } or null (caller should fall back to tree+raw).
async function fetchSkillFolderTar({ author, repo, branch, docPath }) {
  const folderPath = path.posix.dirname(docPath);
  if (folderPath === '.' || folderPath === '') return null; // root-level → use raw

  let branchUsed = branch || 'main';
  let buf;
  try {
    buf = await fetchArchive(author, repo, branchUsed);
  } catch (e) {
    if (e.code === 'NOT_FOUND' && branchUsed !== 'master') {
      branchUsed = 'master';
      buf = await fetchArchive(author, repo, branchUsed);
    } else {
      throw e;
    }
  }
  const files = extractTarGz(buf, folderPath);
  const hasSkillMd = files.some(f => /(^|\/)skill\.md$/i.test(f.rel));
  if (!files.length || !hasSkillMd) return null; // not found in archive → fall back
  return { files, branchUsed, source: 'archive' };
}

// Resolve a skill's folder CONTENTS — archive first (no API budget), tree+raw
// fallback. Returns { files:[{rel,data}], branchUsed, source, note }.
async function getSkillFolder({ author, repo, branch, docPath }) {
  let archiveErr = null;
  try {
    const folder = await fetchSkillFolderTar({ author, repo, branch, docPath });
    if (folder && folder.files.length) {
      return { files: folder.files, branchUsed: folder.branchUsed, source: 'archive', note: null };
    }
  } catch (e) {
    archiveErr = e.message;
  }
  const listing = await listSkillFiles({ author, repo, branch, docPath });
  const files = [];
  for (const f of listing.files) {
    files.push({ rel: f.rel, data: await fetchRaw(author, repo, listing.branchUsed, f.path) });
  }
  const note = archiveErr ? `archive unavailable (${archiveErr}); used the GitHub API` : listing.note;
  return { files, branchUsed: listing.branchUsed, source: 'api', note };
}

module.exports = {
  listSkillFiles, fetchRaw, fetchTree, fetchSkillFolderTar, extractTarGz, getSkillFolder,
};
