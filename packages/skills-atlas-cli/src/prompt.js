// Minimal interactive prompts (no dependencies). Degrades gracefully when not
// attached to a TTY.
'use strict';

const readline = require('readline');

function isInteractive() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => { rl.close(); resolve(answer); });
  });
}

// y/N confirm. Non-interactive returns `def`.
async function confirm(question, def = false) {
  if (!isInteractive()) return def;
  const ans = (await ask(`${question} ${def ? '[Y/n]' : '[y/N]'} `)).trim().toLowerCase();
  if (!ans) return def;
  return ans === 'y' || ans === 'yes';
}

// Numbered choice. Returns selected index, or -1 if non-interactive / invalid.
async function choose(title, labels) {
  if (!isInteractive()) return -1;
  process.stdout.write(title + '\n');
  labels.forEach((l, i) => process.stdout.write(`  ${i + 1}) ${l}\n`));
  const ans = (await ask(`select [1-${labels.length}] (default 1): `)).trim();
  if (!ans) return 0;
  const n = parseInt(ans, 10);
  return Number.isInteger(n) && n >= 1 && n <= labels.length ? n - 1 : -1;
}

module.exports = { isInteractive, confirm, choose, ask };
