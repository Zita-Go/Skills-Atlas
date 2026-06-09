import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUERIES, runStats } from '../stats.js';

function mockDb(perSql) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return { bind: (...args) => ({ all: async () => { calls.push({ sql, args }); return { results: (perSql[sql] || []) }; } }) };
    },
  };
}

// runStats injects the client filter after the shared `WHERE ts>=?` prefix; mirror that here.
const applied = sql => sql.replace('WHERE ts>=?', "WHERE ts>=? AND (?='' OR client=?)");

test('runStats runs every QUERY (client filter injected), binds (cutoff, client, client)', async () => {
  const db = mockDb({ [applied(QUERIES.topSkills)]: [{ target: 'brainstorming', n: 5 }] });
  const out = await runStats(db, 0);
  assert.deepEqual(Object.keys(out).sort(), Object.keys(QUERIES).sort());
  assert.deepEqual(out.topSkills, [{ target: 'brainstorming', n: 5 }]);
  assert.equal(db.calls.length, Object.keys(QUERIES).length);
  assert.ok(db.calls.every(c => c.args.length === 3 && c.args[0] === 0 && c.args[1] === '' && c.args[2] === ''));
});

test('runStats passes a non-zero cutoff + a client filter through', async () => {
  const db = mockDb({});
  await runStats(db, 123456, 'plugin');
  assert.ok(db.calls.every(c => c.args[0] === 123456 && c.args[1] === 'plugin' && c.args[2] === 'plugin'));
});

test('cliCommands excludes the per-prompt suggest hook', () => {
  assert.ok(QUERIES.cliCommands.includes("target!='suggest'"));
});
