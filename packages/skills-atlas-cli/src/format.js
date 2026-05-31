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

// Language-aware field: prefer English when `en`, else the primary (Chinese).
function text(obj, key, en) {
  if (!obj) return '';
  return en ? (obj[key + '_en'] || obj[key] || '') : (obj[key] || obj[key + '_en'] || '');
}

// One search/list result line block.
function renderRow(r, { en = false } = {}) {
  const chain = r.chain ? cyan('⛓ ') : '';
  const cat = en ? (r._catEn || r._cat) : r._cat;
  const lines = [`\n${chain}${bold(text(r, 'group', en))}   ${dim('[' + cat + ']')}`];
  const uc = text(r, 'use_case', en);
  if (uc) lines.push(`  💡 ${uc}`);
  lines.push(`  ${dim('skills:')} ${green(r.skills.join(', '))}`);
  const best = [...(r.sources || [])].sort((a, b) => (b.stars || 0) - (a.stars || 0))[0];
  if (best) {
    const inst = best.install && best.install.command ? ` — ${best.install.command}` : '';
    lines.push(`  ${dim('via')} ${best.name} ${yellow(stars(best.stars))}${dim(inst)}`);
  }
  return lines.join('\n');
}

const PERSONA_EN = {
  'PM': 'PM', '创始人': 'Founder', '工程': 'Engineering', '求职': 'Job-seeking',
  '研究': 'Research', '营销': 'Marketing', '设计': 'Design', '运营': 'Ops', '通用': 'General',
};

// Structured info for a skill (also used as the machine-readable --json shape).
function buildInfo(skillName, { skillIndex, vendors }) {
  const rows = rowsFor(skillIndex, skillName);
  return {
    skill: skillName,
    found: rows.length > 0,
    groups: rows.map(r => ({
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
          license: (v.skill_licenses && v.skill_licenses[skillName]) || s.license || null,
          type: s.type,
          path: docPath || null,
          install: s.install || v.install || null,
        };
      }),
    })),
  };
}

function renderInfo(info, { en = false } = {}) {
  const pick = (zh, e) => (en ? (e || zh) : (zh || e)) || '';
  const out = [];
  out.push(`\n${bold(green(info.skill))}${info.groups.some(g => g.chain) ? ' ' + cyan('⛓') : ''}`);
  for (const g of info.groups) {
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
      out.push(`    • ${bold(s.id)} ${yellow(stars(s.stars))} ${dim(s.type || '')} ${s.license ? dim('(' + s.license + ')') : ''}`);
      out.push(`      ${dim(s.url)}`);
      out.push(`      ${dim('path:')} ${s.path || dim('(whole-repo install — no per-skill folder)')}`);
      if (s.install && s.install.command) {
        out.push(`      ${dim('install:')} ${cyan(s.install.command)}`);
        if (s.install.alt) out.push(`      ${dim('alt:')} ${s.install.alt}`);
        if (s.install.note) out.push(`      ${dim('note:')} ${s.install.note}`);
      }
    }
  }
  return out.join('\n');
}

module.exports = {
  bold, dim, green, cyan, yellow, stars, text, renderRow, buildInfo, renderInfo,
};
