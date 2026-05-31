// GitHub access for installing skills: one tree listing per install, then each
// file fetched from raw.githubusercontent.com (which does not count against the
// 60-req/h unauthenticated API budget). Pure Node fetch, no git binary.
'use strict';

const path = require('path');

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

module.exports = { listSkillFiles, fetchRaw, fetchTree };
