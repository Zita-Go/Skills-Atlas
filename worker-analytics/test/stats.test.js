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

test('runStats runs every QUERY, binds the cutoff, returns one key per query', async () => {
  const db = mockDb({ [QUERIES.topSkills]: [{ target: 'brainstorming', n: 5 }] });
  const out = await runStats(db, 0);
  assert.deepEqual(Object.keys(out).sort(), Object.keys(QUERIES).sort());
  assert.deepEqual(out.topSkills, [{ target: 'brainstorming', n: 5 }]);
  assert.equal(db.calls.length, Object.keys(QUERIES).length);
  assert.ok(db.calls.every(c => c.args.length === 1 && c.args[0] === 0));
});

test('runStats passes a non-zero cutoff through', async () => {
  const db = mockDb({});
  await runStats(db, 123456);
  assert.ok(db.calls.every(c => c.args[0] === 123456));
});
