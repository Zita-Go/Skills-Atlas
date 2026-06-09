#!/usr/bin/env node
'use strict';

const search = require('../src/commands/search');
const info = require('../src/commands/info');
const install = require('../src/commands/install');
const installed = require('../src/commands/installed');
const upgrade = require('../src/commands/upgrade');
const remove = require('../src/commands/remove');
const outdated = require('../src/commands/outdated');
const doctor = require('../src/commands/doctor');
const kit = require('../src/commands/kit');
const sync = require('../src/commands/sync');
const registry = require('../src/commands/registry');
const suggest = require('../src/commands/suggest');
const hook = require('../src/commands/hook');
const gaps = require('../src/commands/gaps');
const gapAnalyze = require('../src/commands/gap-analyze');
const craft = require('../src/commands/craft');
const prune = require('../src/commands/prune');
const setup = require('../src/commands/setup');
const feedback = require('../src/commands/feedback');
const update = require('../src/commands/update');
const mcp = require('../src/commands/mcp');
const telemetry = require('../src/telemetry');
const telemetryCmd = require('../src/commands/telemetry');
const { categories, list } = require('../src/commands/categories');

const VERSION = require('../package.json').version;
// `use` = install + activate inline (emit the SKILL.md so an agent follows it now).
const use = argv => install([...argv, '--inline']);
const commands = { search, info, install, use, kit, sync, installed, upgrade, remove, outdated, doctor, suggest, hook, gaps, 'gap-analyze': gapAnalyze, craft, prune, feedback, setup, update, categories, list, registry, mcp, telemetry: telemetryCmd };

const HELP = `skills-atlas — search, install & manage AI agent skills

usage: skills-atlas <command> [args]

find & install:
  search <query>     find skills (filters: -c category, -p persona, -t type, --chain)
  info <skill>       show description, usage guidance, sources & install command
  install <skill>    download into .claude/skills/ (--chain for the whole workflow)
  use <skill>        install AND activate it for the current session now (inline)

manage what you've installed:
  installed          list installed skills (global + project)
  outdated           show which installed skills have a newer upstream version
  upgrade [skill]    re-fetch to the latest (--all; refuses to clobber local edits)
  remove <skill>     delete an installed skill
  doctor             health check: orphans, drift, missing SKILL.md, license/script risks
  kit                set up the right skills for THIS project (detect + install)
  sync               reproduce a project's kit from skills-atlas.kit.json

getting started:
  setup              what you've got + how to use it (run after installing the plugin)

autopilot (opt-in):
  hook on|off|status proactively suggest a skill in Claude when your prompt fits one
  gaps               kinds of work you keep doing without a skill (run: skills-atlas hook on)
  craft              codify a workflow you keep repeating into a new local skill (Claude drafts it)
  prune              installed skills you no longer use — Claude suggests removing them
  feedback           what the autopilot learned from your installs/removes (sharpens it)
  telemetry on|off|status  anonymous opt-out usage telemetry (no prompts/paths/identity)

catalog:
  update             refresh the catalog from the public data feed
  categories         list the top-level categories
  list [category]    list skill groups (optionally within one category)
  registry           add/list/remove a private catalog source (org-internal skills)

integrations:
  mcp                run as an MCP server (search/info/install/categories for any MCP client)

global flags: --zh (中文 output; English by default), --json (machine output), -h/--help
docs: https://zita-go.github.io/Skills-Atlas/`;

async function main() {
  const [, , sub, ...rest] = process.argv;
  if (!sub || sub === 'help' || sub === '--help' || sub === '-h') { console.log(HELP); return; }
  if (sub === '--version' || sub === '-v') { console.log(VERSION); return; }

  const cmd = commands[sub];
  if (!cmd) {
    console.error(`unknown command: ${sub}\n`);
    console.log(HELP);
    process.exitCode = 1;
    return;
  }
  // Opportunistic, non-blocking background catalog refresh so new skills appear over
  // time without a manual `update`. Skipped for `update` itself; fully fail-silent.
  if (sub !== 'update' && sub !== 'gap-analyze' && sub !== 'setup' && !process.env.SKILLS_ATLAS_SUBCALL) {
    try { require('../src/data').maybeBackgroundRefresh(); } catch { /* ignore */ }
  }
  if (sub !== 'telemetry' && !process.env.SKILLS_ATLAS_SUBCALL) {
    telemetry.emit('cli_cmd', { target: sub });
    try { require('../src/localskills').reportCreated(); } catch { /* ignore */ }
  }
  try {
    await cmd(rest);
  } catch (e) {
    telemetry.emit('cli_err', { target: sub, detail: String(e && e.message || e).slice(0, 200) });
    throw e;
  }
}

main().catch(err => {
  console.error(`error: ${err && err.message ? err.message : err}`);
  process.exit(1);
});
