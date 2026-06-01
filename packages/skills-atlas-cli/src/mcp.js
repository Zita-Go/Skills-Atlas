// Hand-rolled, zero-dep MCP (Model Context Protocol) server exposing the catalog
// over stdio (newline-delimited JSON-RPC 2.0). `handle()` is a pure dispatcher
// (catalog injected) for tests; `start()` wires stdin/stdout. stdout carries ONLY
// protocol JSON — never console.log here.
'use strict';

const path = require('path');
const { loadData } = require('./data');
const { buildIndices, vendorsFor, skillDocPath, suggestSkills } = require('./index-build');
const { runSearch } = require('./search-core');
const { buildInfo } = require('./format');
const fsu = require('./fsutil');
const { installFolder } = require('./installer');

const VERSION = require('../package.json').version;
const PROTOCOL = '2025-06-18';

// ---- tool result formatters (plain text, no ANSI) ----
function fmtSearch(data, { query, limit }) {
  const { flatRows } = buildIndices(data);
  const { rows } = runSearch(flatRows, { query });
  if (!rows.length) return `No skills match "${query}".`;
  const n = Math.min(rows.length, (Number.isInteger(limit) && limit > 0) ? limit : 10);
  const out = rows.slice(0, n).map(r => {
    const src = [...(r.sources || [])].sort((a, b) => (b.stars || 0) - (a.stars || 0))[0] || {};
    const uc = r.use_case_en || r.use_case || '';
    const cmd = src.install && src.install.command ? src.install.command : '';
    return `• ${(r.skills || []).join(', ')}  [${r.group_en || r.group}]` +
      (uc ? `\n  ${uc}` : '') +
      (src.name ? `\n  via ${src.name} ★${src.stars || 0}${cmd ? ` — ${cmd}` : ''}` : '');
  });
  return `${rows.length} result(s) for "${query}" (showing ${n}):\n\n${out.join('\n\n')}`;
}

function fmtInfo(data, { skill }) {
  const idx = buildIndices(data);
  const info = buildInfo(skill, { skillIndex: idx.skillIndex, vendors: data.vendors });
  if (!info.found) {
    const sugg = suggestSkills(idx.skillIndex, skill);
    return `Skill "${skill}" not found.${sugg.length ? ` Did you mean: ${sugg.join(', ')}.` : ''}`;
  }
  const g = info.groups[0];
  const lines = [`${skill}  [${g.category_en || g.category}] — group: ${g.group_en || g.group}`];
  const desc = g.description_en || g.description; if (desc) lines.push(desc);
  const uc = g.use_case_en || g.use_case; if (uc) lines.push(`use case: ${uc}`);
  const wt = g.when_to_use_en || g.when_to_use; if (wt) lines.push(`when: ${wt}`);
  if (g.personas && g.personas.length) lines.push(`personas: ${g.personas.join(', ')}`);
  lines.push('sources:');
  for (const s of g.sources) {
    lines.push(`  - ${s.id} ★${s.stars || 0}${s.license ? ` (${s.license})` : ''}  ${s.path || '(whole-repo install)'}`);
    if (s.install && s.install.command) lines.push(`    install: ${s.install.command}`);
  }
  if (info.groups.length > 1) lines.push(`(+${info.groups.length - 1} other group(s) with a same-named skill)`);
  return lines.join('\n');
}

function fmtCategories(data, { category }) {
  if (!category) {
    const out = data.sections.map(s => {
      const groups = s.subsections.reduce((m, ss) => m + ss.rows.length, 0);
      return `• ${s.title_en || s.title}  (${groups} groups)`;
    });
    return `Categories:\n${out.join('\n')}`;
  }
  const lc = String(category).toLowerCase();
  const sec = data.sections.find(s =>
    (s.title_en || '').toLowerCase().includes(lc) || (s.title || '').toLowerCase().includes(lc));
  if (!sec) return `Category "${category}" not found. Run list_categories with no argument to see them.`;
  const groups = sec.subsections.flatMap(ss => ss.rows.map(r => `  • ${r.group_en || r.group}  — ${(r.skills || []).join(', ')}`));
  return `${sec.title_en || sec.title}:\n${groups.join('\n')}`;
}

async function doInstall(data, { skill, scope, source, dry_run }) {
  const idx = buildIndices(data);
  const candidates = vendorsFor(idx.skillIndex, skill);
  if (!candidates.length) {
    const sugg = suggestSkills(idx.skillIndex, skill);
    return { text: `Skill "${skill}" not found.${sugg.length ? ` Did you mean: ${sugg.join(', ')}.` : ''}`, isError: true };
  }
  const chosen = source
    ? candidates.find(c => c.source.name.toLowerCase() === String(source).toLowerCase())
    : candidates[0];
  if (!chosen) return { text: `Source "${source}" does not provide "${skill}". Available: ${candidates.map(c => c.source.name).join(', ')}.`, isError: true };
  const v = chosen.vendor, src = chosen.source;
  const name = chosen.skill || skill;
  const docPath = skillDocPath(v, name);
  if (!docPath) {
    const cmd = (src.install || v.install || {}).command;
    return { text: `"${skill}" from ${src.name} installs the whole repo, not a single folder.${cmd ? ` Run: ${cmd}` : ''}` };
  }
  const global = scope !== 'project';
  const targetRoot = fsu.installTargetDir({ global });
  const dest = path.join(targetRoot, name);
  if (dry_run) return { text: `[dry run] would install "${skill}" from ${src.name} → ${fsu.tildify(dest)} (no files written).` };
  try {
    const r = await installFolder({
      author: v.author || src.author, repo: v.repo || src.repo,
      branch: v.default_branch || src.default_branch || 'main',
      docPath, dest, targetRoot, skillName: name,
      source: src.name, group: chosen.row && chosen.row.group, category: chosen.row && chosen.row._cat,
    });
    return { text: `Installed "${skill}" — ${r.fileCount} file(s) from ${src.name}@${r.branchUsed} → ${fsu.tildify(r.dest)}.${r.scripts.length ? ` Includes ${r.scripts.length} script file(s); review before use.` : ''}` };
  } catch (e) {
    return { text: `Install failed: ${e.message}`, isError: true };
  }
}

function toolDefs() {
  return [
    { name: 'search_skills', description: 'Search the Skills Atlas catalog of AI agent skills by keyword or short task description.', inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'keywords or a short task description' }, limit: { type: 'integer', minimum: 1, description: 'max results (default 10)' } }, required: ['query'] } },
    { name: 'skill_info', description: 'Show what a catalog skill does, when to use it, its sources, and how to install it.', inputSchema: { type: 'object', properties: { skill: { type: 'string' } }, required: ['skill'] } },
    { name: 'install_skill', description: 'Install a skill from the catalog into .claude/skills/.', inputSchema: { type: 'object', properties: { skill: { type: 'string' }, scope: { type: 'string', enum: ['global', 'project'], description: 'default global (~/.claude/skills)' }, source: { type: 'string', description: 'pick a source when several provide the skill' }, dry_run: { type: 'boolean' } }, required: ['skill'] } },
    { name: 'list_categories', description: "List the catalog's top-level categories, or the skill groups within one.", inputSchema: { type: 'object', properties: { category: { type: 'string', description: 'optional — drill into one category' } } } },
  ];
}

async function callTool(name, args, data) {
  args = args || {};
  switch (name) {
    case 'search_skills':
      if (!args.query) return { text: 'missing required "query".', isError: true };
      return { text: fmtSearch(data, args) };
    case 'skill_info':
      if (!args.skill) return { text: 'missing required "skill".', isError: true };
      return { text: fmtInfo(data, args) };
    case 'list_categories':
      return { text: fmtCategories(data, args) };
    case 'install_skill':
      if (!args.skill) return { text: 'missing required "skill".', isError: true };
      return await doInstall(data, args);
    default:
      return { text: `unknown tool: ${name}`, isError: true };
  }
}

async function handle(req, { data }) {
  const id = req && req.id;
  const ok = result => ({ jsonrpc: '2.0', id, result });
  const err = (code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
  if (!req || req.jsonrpc !== '2.0') return id === undefined ? null : err(-32600, 'Invalid Request');
  switch (req.method) {
    case 'initialize':
      return ok({ protocolVersion: (req.params && req.params.protocolVersion) || PROTOCOL, capabilities: { tools: {} }, serverInfo: { name: 'skills-atlas', version: VERSION } });
    case 'notifications/initialized':
    case 'initialized':
      return null;
    case 'tools/list':
      return ok({ tools: toolDefs() });
    case 'tools/call': {
      const p = req.params || {};
      const r = await callTool(p.name, p.arguments, data);
      return ok({ content: [{ type: 'text', text: r.text }], isError: Boolean(r.isError) });
    }
    default:
      return id === undefined ? null : err(-32601, 'Method not found');
  }
}

function start() {
  let data;
  try { data = loadData({ quiet: true }).data; }
  catch (e) { process.stderr.write(`skills-atlas mcp: ${e.message}\n`); process.exit(1); return; }
  let buf = '';
  let queue = Promise.resolve();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
      if (!line) continue;
      let req; try { req = JSON.parse(line); } catch { continue; }
      queue = queue.then(async () => {
        try { const res = await handle(req, { data }); if (res) process.stdout.write(JSON.stringify(res) + '\n'); }
        catch { /* never crash the server */ }
      });
    }
  });
  process.stdin.on('end', () => { queue.then(() => process.exit(0)); });
}

module.exports = { handle, toolDefs, callTool, start };
