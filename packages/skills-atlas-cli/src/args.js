// Thin wrapper over node:util.parseArgs with a shared option dictionary so each
// command declares only the flags it accepts (typos on others still error).
'use strict';

const { parseArgs } = require('node:util');

const ALL = {
  category: { type: 'string', short: 'c' },
  persona: { type: 'string', short: 'p' },
  type: { type: 'string', short: 't' },
  chain: { type: 'boolean' },
  limit: { type: 'string' },
  global: { type: 'boolean', short: 'g' },
  project: { type: 'boolean' },
  source: { type: 'string', short: 's' },
  force: { type: 'boolean', short: 'f' },
  yes: { type: 'boolean', short: 'y' },
  'dry-run': { type: 'boolean' },
  json: { type: 'boolean' },
  en: { type: 'boolean' },
  zh: { type: 'boolean' },
  all: { type: 'boolean' },
  inline: { type: 'boolean' },
  archetype: { type: 'string' },
  update: { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
};

function parse(argv, allowed) {
  const options = { help: ALL.help, en: ALL.en, zh: ALL.zh };
  for (const k of allowed) {
    if (!ALL[k]) throw new Error(`unknown option spec: ${k}`);
    options[k] = ALL[k];
  }
  return parseArgs({ args: argv, options, allowPositionals: true, strict: true });
}

module.exports = { parse };
