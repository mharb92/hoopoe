import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  needsProxyReexec, parseArgs, configFrom, stagingRow, runLoop, writeArtefacts,
  MAX_CONSECUTIVE_BATCH_FAILURES,
} from '../run.mjs';
import { stubObject } from './stub-judge.mjs';
import { WRITE_TABLE, SupabaseError } from '../db.mjs';

function sourceRows(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1, arabic: `كلمة${i}`, romanization: 'maktoob', english: `word ${i}`,
    pos: i % 4 === 0 ? 'Verb' : 'Noun', category: i % 2 ? 'Verbs' : 'Nouns',
    root: null, conjugation: null, gender: null, dialect_tag: 'D', notes: null, confidence: 5,
  }));
}

function cfgFor(over = {}) {
  return configFrom({ 'spend-cap': '2.50', 'run-id': 'test-run', 'batch-size': '5',
    'no-stage': true, ...over });
}

// Records what the loop asked for and answers from scripted judge behaviour.
function deps({ rows = sourceRows(10), judge, staged = [], upsert } = {}) {
  const calls = [];
  const stagedRows = [];
  return {
    calls,
    stagedRows,
    readDictionary: async () => ({ rows, total: rows.length }),
    stagedIds: async () => staged,
    upsertReview: upsert ?? (async (r) => { stagedRows.push(...r); return { staged: r.length }; }),
    message: (batchRows, i, total) => ({ system: 's', user: `${i}/${total}:${batchRows.length}` }),
    judge: judge ?? (async (batchRows, cfg) => {
      calls.push(batchRows.map((r) => r.id));
      return {
        objects: batchRows.map(stubObject), requestedIds: batchRows.map((r) => r.id),
        usage: { input_tokens: 10 * batchRows.length, output_tokens: 100 * batchRows.length },
        model: cfg.model, stopReason: 'end_turn', raw: '',
      };
    }),
    log: () => {},
  };
}

// --- environment (§2) ------------------------------------------------------

test('needsProxyReexec only fires when a proxy is set and the flag is not', () => {
  assert.equal(needsProxyReexec({ HTTPS_PROXY: 'p' }, []), true);
  assert.equal(needsProxyReexec({ HTTPS_PROXY: 'p', NODE_USE_ENV_PROXY: '1' }, []), false);
  assert.equal(needsProxyReexec({ HTTPS_PROXY: 'p' }, ['--use-env-proxy']), false);
  assert.equal(needsProxyReexec({}, []), false);
});

test('needsProxyReexec never loops: the re-exec marker stops a second hop', () => {
  assert.equal(needsProxyReexec({ HTTPS_PROXY: 'p', DR_PROXY_REEXEC: '1' }, []), false);
});

// --- CLI -------------------------------------------------------------------

test('parseArgs requires an explicit spend cap and names D228', () => {
  assert.throws(() => parseArgs(['--batch-size', '60']), /--spend-cap is required[\s\S]*D228/);
});

test('parseArgs rejects an unknown argument and a flag with no value', () => {
  assert.throws(() => parseArgs(['--spend-cap', '1', '--turbo']), /unknown argument --turbo/);
  assert.throws(() => parseArgs(['--spend-cap']), /--spend-cap needs a value/);
});

test('parseArgs refuses a stub judge that could reach the staging table', () => {
  assert.throws(() => parseArgs(['--spend-cap', '1', '--judge-from', 'x.mjs']),
    /--judge-from requires --no-stage/);
  assert.ok(parseArgs(['--spend-cap', '1', '--judge-from', 'x.mjs', '--no-stage']));
});

test('configFrom reads the cap from the caller and never invents one', () => {
  assert.equal(cfgFor().spendCapUsd, 2.5);
  assert.equal(configFrom({ 'spend-cap': '20.00' }).spendCapUsd, 20);
  assert.throws(() => configFrom({ 'spend-cap': 'free' }), /--spend-cap must be a positive number/);
  assert.throws(() => configFrom({ 'spend-cap': '0' }), /--spend-cap must be a positive number/);
});

test('configFrom rejects a --max-batches that would silently mean "all of them"', () => {
  assert.throws(() => cfgFor({ 'max-batches': 'one' }), /--max-batches must be a positive integer/);
  assert.throws(() => cfgFor({ 'max-batches': '0' }), /--max-batches must be a positive integer/);
});

test('configFrom keeps the scoped defaults and passes overrides through', () => {
  const c = cfgFor({ 'batch-size': undefined, 'max-batches': '1', effort: 'max' });
  assert.equal(c.batchSize, 60);
  assert.equal(c.maxBatches, 1);
  assert.equal(c.effort, 'max');
  assert.equal(c.transport, 'anthropic-direct');
});

// --- staging row -----------------------------------------------------------

test('stagingRow keys on (run_id, dictionary_id) and carries rule_fix, routing and the score', () => {
  const obj = stubObject(sourceRows(1)[0]);
  const row = stagingRow({ runId: 'r1', batchNo: 3, ruleFix: { id: 1, fixed: { track_id: 'palestinian' }, flags: [] },
    obj, routed: { status: 'held', routing: { level: 'held' }, review_confidence: 2 } });
  assert.equal(row.run_id, 'r1');
  assert.equal(row.dictionary_id, obj.id);
  assert.equal(row.batch_no, 3);
  assert.equal(row.status, 'held');
  assert.deepEqual(row.payload.model, obj); // verbatim
  assert.equal(row.payload.rule_fix.fixed.track_id, 'palestinian');
  assert.deepEqual(row.payload.routing, { level: 'held' });
  assert.equal(row.payload.review_confidence, 2);
  assert.equal(WRITE_TABLE, 'dictionary_review'); // the only table any write names
});

// --- the loop --------------------------------------------------------------

test('runLoop stages every row exactly once across the plan', async () => {
  const d = deps();
  const state = await runLoop(cfgFor(), { ...d, upsertReview: d.upsertReview });
  assert.equal(state.stopReason, 'completed');
  assert.equal(state.plannedBatches, 2);
  const ids = d.stagedRows.map((r) => r.dictionary_id).sort((a, b) => a - b);
  assert.deepEqual(ids, Array.from({ length: 10 }, (_, i) => i + 1));
  assert.equal(state.batches.reduce((n, b) => n + b.staged, 0), 10);
});

test('resume skips ids already staged for the run and reports the count', async () => {
  const d = deps({ staged: [1, 2, 3, 4, 5, 6, 7] });
  const state = await runLoop({ ...cfgFor(), stage: true }, d);
  assert.equal(state.resumedSkipped, 7);
  const ids = d.stagedRows.map((r) => r.dictionary_id).sort((a, b) => a - b);
  assert.deepEqual(ids, [8, 9, 10]);
});

test('the same seed replays the same plan, so a restart needs no plan file', async () => {
  const a = await runLoop(cfgFor(), deps());
  const b = await runLoop(cfgFor(), deps());
  assert.deepEqual(a.batches.map((x) => x.requestedIds), b.batches.map((x) => x.requestedIds));
});

test('--max-batches stops the loop after n batches (the pilot is 1)', async () => {
  const state = await runLoop(cfgFor({ 'max-batches': '1' }), deps());
  assert.equal(state.batches.length, 1);
  assert.equal(state.stopReason, 'max-batches');
});

test('the spend cap halts the loop rather than warning', async () => {
  const d = deps({ rows: sourceRows(30) });
  const state = await runLoop(cfgFor({ 'spend-cap': '0.05' }), d);
  assert.equal(state.stopReason, 'spend-cap');
  assert.ok(state.batches.length < 6);
});

test('two consecutive batches that stage nothing halt the run', async () => {
  const d = deps({ judge: async (batchRows) => ({
    objects: batchRows.map((r) => ({ ...stubObject(r), level: 99 })), // fails validation every time
    requestedIds: batchRows.map((r) => r.id),
    usage: { output_tokens: 10 }, model: 'claude-opus-5', stopReason: 'end_turn', raw: '',
  }) });
  const state = await runLoop(cfgFor(), d);
  assert.equal(state.stopReason, 'two-consecutive-batch-failures');
  assert.equal(state.batches.length, MAX_CONSECUTIVE_BATCH_FAILURES);
  assert.equal(d.stagedRows.length, 0);
});

test('a non-2xx from Supabase throws out of the loop instead of being swallowed', async () => {
  const d = deps({ upsert: async () => { throw new SupabaseError('db: 403 permission denied', { status: 403 }); } });
  await assert.rejects(() => runLoop(cfgFor(), d), /403 permission denied/);
});

test('an invalid row gets exactly one repair retry and is left unstaged if it fails again', async () => {
  let call = 0;
  const d = deps({ rows: sourceRows(5), judge: async (batchRows, cfg) => {
    call++;
    const objects = batchRows.map((r) => (r.id === 3 ? { ...stubObject(r), level_conf: 'X' } : stubObject(r)));
    return { objects, requestedIds: batchRows.map((r) => r.id),
      usage: { output_tokens: 10 * batchRows.length }, model: cfg.model, stopReason: 'end_turn', raw: '' };
  } });
  const state = await runLoop(cfgFor(), d);
  assert.equal(call, 2); // the batch, then one repair call for row 3 only
  assert.equal(state.batches[0].repairAttempts, 1);
  assert.deepEqual(state.batches[0].unresolvedIds, [3]);
  assert.equal(state.batches[0].staged, 4);
  assert.ok(!d.stagedRows.some((r) => r.dictionary_id === 3));
});

test('a repaired row is staged and leaves nothing unresolved', async () => {
  let call = 0;
  const d = deps({ rows: sourceRows(5), judge: async (batchRows, cfg) => {
    const bad = call++ === 0;
    const objects = batchRows.map((r) => (bad && r.id === 3 ? { ...stubObject(r), level_conf: 'X' } : stubObject(r)));
    return { objects, requestedIds: batchRows.map((r) => r.id),
      usage: { output_tokens: 10 * batchRows.length }, model: cfg.model, stopReason: 'end_turn', raw: '' };
  } });
  const state = await runLoop(cfgFor(), d);
  assert.deepEqual(state.batches[0].unresolvedIds, []);
  assert.equal(state.batches[0].staged, 5);
});

test('ids the model volunteered are never staged, and a duplicate is not staged twice', async () => {
  const d = deps({ rows: sourceRows(5), judge: async (batchRows, cfg) => {
    const objects = batchRows.map(stubObject);
    objects.push(stubObject({ ...batchRows[0], id: 9999 })); // never requested
    objects.push(stubObject(batchRows[0])); // duplicate of a requested id
    return { objects, requestedIds: batchRows.map((r) => r.id),
      usage: { output_tokens: 10 }, model: cfg.model, stopReason: 'end_turn', raw: '' };
  } });
  const state = await runLoop(cfgFor(), d);
  assert.ok(!d.stagedRows.some((r) => r.dictionary_id === 9999));
  assert.equal(d.stagedRows.length, 5);
  assert.deepEqual(state.batches[0].firstPass.extraIds, [9999]);
  assert.deepEqual(state.batches[0].firstPass.duplicateIds, [state.batches[0].requestedIds[0]]);
});

// --- artefacts -------------------------------------------------------------

test('writeArtefacts leaves a manifest and a report under runs/<run_id>/', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'dr-runs-'));
  try {
    const cfg = cfgFor({ 'runs-dir': dir });
    const state = await runLoop(cfg, deps());
    const { dir: runDir, report } = await writeArtefacts(cfg, state);
    assert.equal(runDir, path.join(dir, 'test-run'));
    const manifest = JSON.parse(await readFile(path.join(runDir, 'manifest.json'), 'utf8'));
    assert.equal(manifest.run_id, 'test-run');
    assert.equal(manifest.seed, cfg.seed);
    assert.equal(manifest.spend_cap_usd, 2.5);
    assert.equal(manifest.stop_reason, 'completed');
    const onDisk = JSON.parse(await readFile(path.join(runDir, 'report.json'), 'utf8'));
    assert.equal(onDisk.totals.rows_staged, report.totals.rows_staged);
    assert.equal(onDisk.checks.length, 10);
    assert.match(await readFile(path.join(runDir, 'report.txt'), 'utf8'), /P10/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
