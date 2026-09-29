import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateVerdict, judgeBatch, planBatches, buildUser, effortFor, BATCH_SIZE } from '../external-judge.mjs';

const row = (k, category = 'harakaat_variant') => ({ k, category, discrepancy: 'd',
  ours: { arabic: 'عِمِل', vocalised: 'عِمِل', english: 'did', pos: 'verb' },
  theirs: { word: 'عَمَل', transliteration: '3amal', meaning: 'To do', category: 'verb' } });
const stub = (responses) => {
  const calls = [];
  const impl = async ({ message, effort }) => { calls.push({ user: message.user, effort }); return { raw: responses.shift(), usd: 0.01, stopReason: 'end_turn' }; };
  return { impl, calls };
};

test('verdict validation: enum per category, dialect, conf, fix only with ours_wrong', () => {
  assert.equal(validateVerdict({ v: 'keep_ours', d: 'pal', c: 'H' }, 'harakaat_variant'), null);
  assert.match(validateVerdict({ v: 'add', d: 'pal', c: 'H' }, 'harakaat_variant'), /not valid/);
  assert.match(validateVerdict({ v: 'ours_wrong', d: 'pal', c: 'H' }, 'different_word'), /fix/);
  assert.match(validateVerdict({ v: 'ours_wrong', d: 'pal', c: 'H', fix: 'amal' }, 'different_word'), /fix/);
  assert.equal(validateVerdict({ v: 'ours_wrong', d: 'pal', c: 'M', fix: 'عَمَل', n: 'short note' }, 'different_word'), null);
  assert.match(validateVerdict({ v: 'skip', d: 'x', c: 'H' }, 'only_theirs'), /dialect/);
  assert.match(validateVerdict({ v: 'keep_ours', d: 'pal', c: 'H', fix: 'عَمَل' }, 'harakaat_variant'), /only allowed/);
});

test('judgeBatch: one repair call for missing keys, then settles', async () => {
  const { impl, calls } = stub([
    '{"k":"r1","v":"keep_ours","d":"lev_other","c":"H"}',
    '{"k":"r2","v":"both_valid","d":"pal","c":"M"}',
  ]);
  const { verdicts, usd, repaired } = await judgeBatch('harakaat_variant', [row('r1'), row('r2')], impl);
  assert.deepEqual(Object.keys(verdicts).sort(), ['r1', 'r2']);
  assert.equal(repaired, 1);
  assert.equal(usd, 0.02);
  assert.equal(calls.length, 2);
  assert.match(calls[1].user, /"k":"r2"/);
  assert.doesNotMatch(calls[1].user, /"k":"r1"/);
  assert.equal(calls[0].effort, 'medium');
});

test('judgeBatch: still unresolved after repair stops the run, keeping what settled', async () => {
  const { impl } = stub(['{"k":"r1","v":"keep_ours","d":"pal","c":"H"}', '{"k":"r2","v":"nonsense","d":"pal","c":"H"}']);
  await assert.rejects(judgeBatch('harakaat_variant', [row('r1'), row('r2')], impl), (e) => {
    assert.match(e.message, /1 rows unresolved/);
    assert.deepEqual(Object.keys(e.partial.out), ['r1']);
    return true;
  });
});

test('batches: per category, at most BATCH_SIZE, skipping judged keys; effort by category', () => {
  const rows = [...Array(BATCH_SIZE + 5)].map((_, i) => row(`r${i}`, 'only_theirs')).concat([row('h1'), { ...row('s1'), category: 'spelling_variant' }]);
  const b = planBatches(rows, { r0: {} });
  assert.deepEqual(b.map((x) => [x.category, x.rows.length]), [['harakaat_variant', 1], ['only_theirs', BATCH_SIZE], ['only_theirs', 4]]);
  assert.equal(effortFor('only_theirs'), 'low');
});

test('user message: only_theirs rows carry ours null', () => {
  const u = buildUser('only_theirs', [{ ...row('r9', 'only_theirs'), ours: null }]);
  assert.match(u, /"ours":null/);
  assert.match(u, /ours is null/);
});
