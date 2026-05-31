// Build in-memory indices from the catalog: a flat list of rows (for search /
// browse) and a skill-name index (for info / install resolution).
'use strict';

function buildIndices(data) {
  const flatRows = [];
  // lowerSkillName -> [{ skill, row, source, vendor }]
  const skillIndex = new Map();

  for (const s of data.sections) {
    for (const ss of s.subsections) {
      for (const row of ss.rows) {
        const r = { ...row, _cat: s.title, _catEn: s.title_en, _sub: ss.title, _subEn: ss.title_en };
        flatRows.push(r);
        for (const skill of row.skills || []) {
          const key = String(skill).toLowerCase();
          let arr = skillIndex.get(key);
          if (!arr) { arr = []; skillIndex.set(key, arr); }
          for (const source of row.sources || []) {
            arr.push({ skill, row: r, source, vendor: data.vendors[source.name] || null });
          }
        }
      }
    }
  }
  return { flatRows, skillIndex, vendors: data.vendors, sections: data.sections };
}

// All entries (one per source) for an exact skill name.
function entriesFor(skillIndex, skillName) {
  return skillIndex.get(String(skillName).toLowerCase()) || [];
}

// The in-repo SKILL.md path for a skill in a vendor, or null. Matches the
// skill_docs key exactly first, then case-insensitively.
function skillDocPath(vendor, skillName) {
  if (!vendor || !vendor.skill_docs) return null;
  if (vendor.skill_docs[skillName]) return vendor.skill_docs[skillName];
  const lk = String(skillName).toLowerCase();
  for (const k of Object.keys(vendor.skill_docs)) {
    if (k.toLowerCase() === lk) return vendor.skill_docs[k];
  }
  return null;
}

// Distinct vendors that provide a skill. Installable sources (those exposing the
// skill's own folder) rank first, then by stars — so --yes / the default pick a
// source that can actually fetch a folder when one exists.
function vendorsFor(skillIndex, skillName) {
  const seen = new Map();
  for (const e of entriesFor(skillIndex, skillName)) {
    const id = e.source && e.source.name;
    if (id && !seen.has(id)) seen.set(id, e);
  }
  return [...seen.values()].sort((a, b) => {
    const da = skillDocPath(a.vendor, a.skill) ? 1 : 0;
    const db = skillDocPath(b.vendor, b.skill) ? 1 : 0;
    if (da !== db) return db - da;
    return (b.source.stars || 0) - (a.source.stars || 0);
  });
}

// Distinct rows containing a skill (a skill usually belongs to one group).
function rowsFor(skillIndex, skillName) {
  const seen = new Map();
  for (const e of entriesFor(skillIndex, skillName)) {
    if (!seen.has(e.row)) seen.set(e.row, e.row);
  }
  return [...seen.values()];
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

// Nearest skill names for a not-found query.
function suggestSkills(skillIndex, query, max = 5) {
  const q = String(query).toLowerCase().trim();
  if (!q) return [];
  const names = [...skillIndex.keys()];

  // 1) substring either way — high-signal.
  const sub = names.filter(n => n.includes(q) || q.includes(n));
  if (sub.length) return sub.slice(0, max);

  // 2) share a meaningful word with the query (helps multi-word misses).
  const qtokens = q.split(/[^a-z0-9一-鿿]+/)
    .filter(t => (/[一-鿿]/.test(t) ? t.length >= 2 : t.length >= 3));
  if (qtokens.length) {
    const overlap = names.filter(n => qtokens.some(t => n.includes(t)));
    if (overlap.length) return overlap.slice(0, max);
  }

  // 3) fuzzy, but GATED to close edits only — return nothing rather than noise.
  const limit = Math.max(1, Math.floor(q.length * 0.34));
  return names
    .map(n => [n, levenshtein(q, n)])
    .filter(([, d]) => d <= limit)
    .sort((a, b) => a[1] - b[1])
    .slice(0, max)
    .map(s => s[0]);
}

module.exports = { buildIndices, entriesFor, vendorsFor, rowsFor, suggestSkills, skillDocPath };
