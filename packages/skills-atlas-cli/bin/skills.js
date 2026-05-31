#!/usr/bin/env node
'use strict';

const search = require('../src/commands/search');
const info = require('../src/commands/info');
const install = require('../src/commands/install');
const installed = require('../src/commands/installed');
const update = require('../src/commands/update');
const { categories, list } = require('../src/commands/categories');

const VERSION = require('../package.json').version;
const commands = { search, info, install, installed, update, categories, list };

const HELP = `skills-atlas — search, install & learn AI agent skills

usage: skills-atlas <command> [args]

commands:
  search <query>     find skills (filters: -c category, -p persona, -t type, --chain)
  info <skill>       show description, usage guidance, sources & install command
  install <skill>    download the skill into .claude/skills/ (--chain for the whole workflow)
  installed          list skills you've installed (global + project)
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
