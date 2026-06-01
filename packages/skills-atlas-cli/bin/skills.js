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
const suggest = require('../src/commands/suggest');
const hook = require('../src/commands/hook');
const update = require('../src/commands/update');
const { categories, list } = require('../src/commands/categories');

const VERSION = require('../package.json').version;
// `use` = install + activate inline (emit the SKILL.md so an agent follows it now).
const use = argv => install([...argv, '--inline']);
const commands = { search, info, install, use, installed, upgrade, remove, outdated, doctor, suggest, hook, update, categories, list };

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

autopilot (opt-in):
  hook on|off|status proactively suggest a skill in Claude when your prompt fits one

catalog:
  update             refresh the catalog from the public data feed
  categories         list the top-level categories
  list [category]    list skill groups (optionally within one category)

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
  await cmd(rest);
}

main().catch(err => {
  console.error(`error: ${err && err.message ? err.message : err}`);
  process.exit(1);
});
