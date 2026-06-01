// Shared output formatting: colors (TTY only), stars, language-aware text, and
// the row / info renderers reused across commands.
'use strict';

const { rowsFor, skillDocPath } = require('./index-build');

const useColor = () => Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const wrap = (code, s) => (useColor() ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const bold = s => wrap('1', s);
const dim = s => wrap('2', s);
const green = s => wrap('32', s);
const cyan = s => wrap('36', s);
const yellow = s => wrap('33', s);

function stars(n) {
  if (n == null) return '';
  if (n >= 10000) return `★${Math.round(n / 1000)}k`;
  if (n >= 1000) return `★${(n / 1000).toFixed(1)}k`;
  return `★${n}`;
}

// Repo freshness from a source's `last_commit` ("2026-05-28"). Returns null if
// absent/unparseable. `stale` flags a repo untouched for over a year — so a popular
// but abandoned source no longer looks identical to an actively maintained one.
function recency(lastCommit, now = Date.now()) {
  if (!lastCommit) return null;
  const t = Date.parse(lastCommit);
  if (!Number.isFinite(t)) return null;
  const days = Math.floor((now - t) / 86400000);
  return { date: String(lastCommit).slice(0, 10), days, stale: days > 365 };
}

// A `git clone <repo> ~/.claude/skills/skills` alt double-nests a multi-skill
// monorepo (skills end up at .claude/skills/skills/<name>/) and won't load —
// drop that foot-gun; the `npx skills add` command is the correct path.
function safeAlt(alt) {
  if (!alt) return null;
  if (/\.claude\/skills\/skills\b/.test(alt)) return null;
  return alt;
}

// Language-aware field: prefer English when `en`, else the primary (Chinese).
function text(obj, key, en) {
  if (!obj) return '';
  return en ? (obj[key + '_en'] || obj[key] || '') : (obj[key] || obj[key + '_en'] || '');
}

// One search/list result line block. `installed` (a Set of skill names) marks what
// you already have; `vendors` lets the source line say whether install is a clean
// single-skill folder or a whole-repo command.
function renderRow(r, { en = false, installed = null, vendors = null } = {}) {
  const chain = r.chain ? cyan('⛓ ') : '';
  const cat = en ? (r._catEn || r._cat) : r._cat;
  const lines = [`\n${chain}${bold(text(r, 'group', en))}   ${dim('[' + cat + ']')}`];
  const uc = text(r, 'use_case', en);
  if (uc) lines.push(`  💡 ${uc}`);
  const SK_MAX = 8;
  const sk = r.skills || [];
  const tick = s => (installed && installed.has(s)) ? green(s + ' ✓') : green(s);
  const skStr = sk.length > SK_MAX
    ? sk.slice(0, SK_MAX).map(tick).join(dim(', ')) + dim(` +${sk.length - SK_MAX} more`)
    : sk.map(tick).join(dim(', '));
  lines.push(`  ${dim('skills:')} ${skStr}`);
  const best = [...(r.sources || [])].sort((a, b) => (b.stars || 0) - (a.stars || 0))[0];
  if (best) {
    const rec = recency(best.last_commit);
    const recStr = rec ? `  updated ${rec.date}${rec.stale ? ' ⚠' : ''}` : '';
    let kind = '';
    if (vendors) {
      const v = vendors[best.name];
      kind = (v && skillDocPath(v, sk[0])) ? '  [single-skill]' : '  [whole-repo]';
    }
    const inst = best.install && best.install.command ? ` — ${best.install.command}` : '';
    lines.push(`  ${dim('via')} ${best.name} ${yellow(stars(best.stars))}${dim(recStr)}${dim(kind)}${dim(inst)}`);
  }
  return lines.join('\n');
}

const PERSONA_EN = {
  'PM': 'PM', '创始人': 'Founder', '工程': 'Engineering', '求职': 'Job-seeking',
  '研究': 'Research', '营销': 'Marketing', '设计': 'Design', '运营': 'Ops', '通用': 'General',
};

// Rank a row best-first: top stars, then total stars, then source count — so a
// star tie (one popular source shared across namesake groups) breaks meaningfully.
function rowRank(r) {
  const ss = (r.sources || []).map(s => s.stars || 0);
  return { max: Math.max(0, ...ss), sum: ss.reduce((a, b) => a + b, 0), n: ss.length };
}

// The per-group info object for one row.
function groupOf(r, skillName, vendors) {
  return {
    group: r.group,
    group_en: r.group_en,
    category: r._cat,
    category_en: r._catEn,
    chain: r.chain,
    description: r.description,
    description_en: r.description_en,
    use_case: r.use_case,
    use_case_en: r.use_case_en,
    when_to_use: r.when_to_use,
    when_to_use_en: r.when_to_use_en,
    personas: r.personas || [],
    sources: (r.sources || []).map(s => {
      const v = vendors[s.name] || {};
      const docPath = skillDocPath(v, skillName);
      return {
        id: s.name,
        url: s.url,
        stars: s.stars,
        last_commit: s.last_commit || v.last_commit || null,
        license: (v.skill_licenses && v.skill_licenses[skillName]) || s.license || null,
        type: s.type,
        path: docPath || null,
        install: s.install || v.install || null,
      };
    }),
  };
}

// Is this row backed by a private (registry) source? Private vendors are tagged
// `_private` by mergeCatalogs, so on a same-name clash the org's own version leads.
function isPrivateRow(r, vendors) {
  return (r.sources || []).some(s => vendors[s.name] && vendors[s.name]._private);
}

// Structured info for a skill (also the machine-readable --json shape). Groups
// are ordered best-first — private (registry) groups first, then by stars — so the
// most relevant one leads (consistent with vendorsFor's install resolution).
function buildInfo(skillName, { skillIndex, vendors }) {
  const rows = rowsFor(skillIndex, skillName).slice().sort((a, b) => {
    const pa = isPrivateRow(a, vendors) ? 1 : 0;
    const pb = isPrivateRow(b, vendors) ? 1 : 0;
    if (pa !== pb) return pb - pa;               // private (registry) groups first
    const A = rowRank(a), B = rowRank(b);
    return B.max - A.max || B.sum - A.sum || B.n - A.n;
  });
  return {
    skill: skillName,
    found: rows.length > 0,
    groups: rows.map(r => groupOf(r, skillName, vendors)),
  };
}

// Single-group info for one specific row (scoped post-install guidance — scopes
// by row identity, so two namesake rows with the same group name don't both show).
function infoForRow(skillName, row, vendors) {
  return { skill: skillName, found: true, groups: [groupOf(row, skillName, vendors)] };
}

function renderInfo(info, { en = false, all = false, installed = null } = {}) {
  const pick = (zh, e) => (en ? (e || zh) : (zh || e)) || '';
  const out = [];
  const instTag = installed && installed.length
    ? ` ${green('✓ installed')} ${dim('[' + installed.join('+') + ']')}` : '';
  out.push(`\n${bold(green(info.skill))}${info.groups.some(g => g.chain) ? ' ' + cyan('⛓') : ''}${instTag}`);
  const shown = all ? info.groups : info.groups.slice(0, 1);
  for (const g of shown) {
    out.push(`  ${dim('group:')} ${pick(g.group, g.group_en)}  ${dim('[' + pick(g.category, g.category_en) + ']')}`);
    const desc = pick(g.description, g.description_en);
    if (desc) out.push(`  ${desc}`);
    const uc = pick(g.use_case, g.use_case_en);
    if (uc) out.push(`  ${dim('use case:')} ${uc}`);
    const wt = pick(g.when_to_use, g.when_to_use_en);
    if (wt) out.push(`  ${dim('when:')} ${wt}`);
    if (g.personas && g.personas.length) {
      out.push(`  ${dim('personas:')} ${g.personas.map(p => en ? (PERSONA_EN[p] || p) : p).join(' / ')}`);
    }
    out.push(`  ${dim('sources:')}`);
    for (const s of g.sources) {
      const rec = recency(s.last_commit);
      const recStr = rec ? `  ${dim('updated ' + rec.date)}${rec.stale ? ' ' + yellow('⚠ stale') : ''}` : '';
      out.push(`    • ${bold(s.id)} ${yellow(stars(s.stars))} ${dim(s.type || '')} ${s.license ? dim('(' + s.license + ')') : ''}${recStr}`);
      out.push(`      ${dim(s.url)}`);
      out.push(`      ${dim('path:')} ${s.path || dim('(whole-repo install — no per-skill folder)')}`);
      if (s.install && s.install.command) {
        out.push(`      ${dim('install:')} ${cyan(s.install.command)}`);
        const alt = safeAlt(s.install.alt);
        if (alt) out.push(`      ${dim('alt:')} ${alt}`);
        if (s.install.note) out.push(`      ${dim('note:')} ${s.install.note}`);
      }
    }
  }
  if (!all && info.groups.length > 1) {
    const others = info.groups.slice(1).map(g => pick(g.group, g.group_en));
    out.push(dim(`  + ${others.length} other group(s) with a same-named skill: ${others.join('; ')}`));
    out.push(dim(`    (run \`skills-atlas info ${info.skill} --all\` to expand)`));
  }
  return out.join('\n');
}

module.exports = {
  bold, dim, green, cyan, yellow, stars, recency, safeAlt, text, renderRow,
  buildInfo, infoForRow, renderInfo, PERSONA_EN,
};
