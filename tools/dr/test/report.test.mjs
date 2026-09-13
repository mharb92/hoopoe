import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  priceUsage, longVowelSeq, isVowelLengthFlip, distribution, spread,
  pilotChecks, buildReport, renderReport, PRICING_USD_PER_MTOK, TOTAL_ROWS,
} from '../report.mjs';

const byId = (checks) => Object.fromEntries(checks.map((c) => [c.id, c]));

function obj(id, over = {}) {
  return {
    id, level: 1, level_reason: 'r', level_conf: 'H', pos: 'noun', register: 'neutral',
    form_origin: 'dialect', enum_conf: 'H', romanization: { value: 'beet', conf: 'H', changed: false },
    arabic_vocalised: { value: 'بيت', conf: 'H' }, native_check: false, ...over,
  };
}

function state(objects, over = {}) {
  const batch = {
    batchNo: 1, requestedIds: objects.map((o) => o.id),
    firstPass: { missingIds: [], extraIds: [], duplicateIds: [] },
    unresolvedIds: [], repairAttempts: 0, objects,
    routed: objects.map((o) => ({ id: o.id, status: 'auto', routing: {}, review_confidence: 3 })),
    sourceRomanization: Object.fromEntries(objects.map((o) => [o.id, 'beet'])),
    calls: [{ rows: objects.length, usage: { input_tokens: 100, output_tokens: 200 }, usd: 0.01 }],
    staged: objects.length,
    ...over,
  };
  return { runId: 'r1', config: { spendCapUsd: 2.5, maxTokens: 64000 }, batches: [batch] };
}

// --- cost ------------------------------------------------------------------

test('priceUsage prices uncached input, cache write, cache read and output separately', () => {
  const p = PRICING_USD_PER_MTOK['claude-opus-5'];
  const r = priceUsage({
    input_tokens: 1e6, cache_creation_input_tokens: 1e6, cache_read_input_tokens: 1e6, output_tokens: 1e6,
  }, 'claude-opus-5');
  assert.equal(r.usdInput, p.input);
  assert.equal(r.usdCacheWrite, p.cacheWrite5m);
  assert.equal(r.usdCacheRead, p.cacheRead);
  assert.equal(r.usdOutput, p.output);
  assert.equal(r.usd, p.input + p.cacheWrite5m + p.cacheRead + p.output);
});

test('priceUsage splits cache writes by TTL when the breakdown is present', () => {
  const p = PRICING_USD_PER_MTOK['claude-opus-5'];
  const r = priceUsage({
    cache_creation_input_tokens: 2e6,
    cache_creation: { ephemeral_5m_input_tokens: 1e6, ephemeral_1h_input_tokens: 1e6 },
  }, 'claude-opus-5');
  assert.equal(r.usdCacheWrite, p.cacheWrite5m + p.cacheWrite1h);
});

test('priceUsage refuses an unpriced model rather than metering against a guess', () => {
  assert.throws(() => priceUsage({ output_tokens: 1 }, 'some-future-model'), /no price for model/);
});

// --- vowel length (P10, D210) ----------------------------------------------

test('longVowelSeq finds the five long vowels in order and does not overlap', () => {
  assert.deepEqual(longVowelSeq('maktoob'), ['oo']);
  assert.deepEqual(longVowelSeq('baab il-beet'), ['aa', 'ee']);
  assert.deepEqual(longVowelSeq('aaa'), ['aa']);
  assert.deepEqual(longVowelSeq(null), []);
});

test('isVowelLengthFlip counts a swap inside a conflated pair, not other edits', () => {
  assert.equal(isVowelLengthFlip('maktoob', 'maktuub'), true);
  assert.equal(isVowelLengthFlip('kabeer', 'kabiir'), true);
  assert.equal(isVowelLengthFlip('maktoob', 'maktoob'), false);
  assert.equal(isVowelLengthFlip('ktaab', 'kitaab'), false); // same long vowel, respelled
  assert.equal(isVowelLengthFlip('bait', 'beet'), false); // short to long is not a flip
  assert.equal(isVowelLengthFlip('shu', 'shu'), false);
});

test('isVowelLengthFlip falls back to the class split when the word was rewritten', () => {
  assert.equal(isVowelLengthFlip('il beet kabeer', 'il-biit kabeer'), true);
  assert.equal(isVowelLengthFlip('il beet', 'il-beet kteer'), false); // class total changed
});

// --- helpers ---------------------------------------------------------------

test('distribution counts by value and spread reports more than the mean', () => {
  assert.deepEqual(distribution([1, 2, 2, 3]), { 1: 1, 2: 2, 3: 1 });
  const s = spread([10, 20, 30, 40]);
  assert.equal(s.min, 10);
  assert.equal(s.max, 40);
  assert.equal(s.mean, 25);
  assert.equal(spread([]), null);
});

// --- P1-P10 ----------------------------------------------------------------

test('P1 fails on a missing, duplicate or extra id in the first response', () => {
  const c = byId(pilotChecks(state([obj(1)], { firstPass: { missingIds: [7], extraIds: [], duplicateIds: [] } })));
  assert.equal(c.P1.pass, false);
});

test('P2 fails when a row is still unresolved after the one repair retry', () => {
  assert.equal(byId(pilotChecks(state([obj(1)], { unresolvedIds: [9], repairAttempts: 1 }))).P2.pass, false);
  assert.equal(byId(pilotChecks(state([obj(1)]))).P2.pass, true);
});

test('P3 fails on a non-enum value and P4 on a missing level field', () => {
  assert.equal(byId(pilotChecks(state([obj(1, { pos: 'Verb' })]))).P3.pass, false);
  assert.equal(byId(pilotChecks(state([obj(1, { level_reason: '' })]))).P4.pass, false);
});

test('P5 fails when the level spread collapses to two values', () => {
  const two = [obj(1, { level: 1 }), obj(2, { level: 2 }), obj(3, { level: 1 })];
  assert.equal(byId(pilotChecks(state(two))).P5.pass, false);
  const three = [...two, obj(4, { level: 4 })];
  assert.equal(byId(pilotChecks(state(three))).P5.pass, true);
});

test('P6 reads the verb share of the level 1-2 rows against the F3 floor', () => {
  const rows = [obj(1, { level: 1, pos: 'verb' }), obj(2, { level: 2, pos: 'noun' }),
    obj(3, { level: 1, pos: 'noun' }), obj(4, { level: 5, pos: 'noun' })];
  const p6 = byId(pilotChecks(state(rows))).P6;
  assert.equal(p6.value.lowBandRows, 3);
  assert.equal(p6.pass, true); // 1/3 clears the 0.30 floor
  assert.equal(byId(pilotChecks(state([obj(1, { level: 1, pos: 'noun' })]))).P6.pass, false);
});

test('P7 records held and native_check rates without gating', () => {
  const rows = [obj(1), obj(2, { native_check: true })];
  const s = state(rows);
  s.batches[0].routed[1].status = 'held';
  const p7 = byId(pilotChecks(s)).P7;
  assert.equal(p7.pass, null);
  assert.equal(p7.value.heldRate, 0.5);
  assert.equal(p7.value.nativeCheckRate, 0.5);
});

test('P8 reports a distribution and the worst call against max_tokens', () => {
  const s = state([obj(1), obj(2)]);
  s.batches[0].calls = [
    { rows: 1, usage: { output_tokens: 100 }, usd: 0.01 },
    { rows: 1, usage: { output_tokens: 900 }, usd: 0.02 },
  ];
  const p8 = byId(pilotChecks(s)).P8;
  assert.equal(p8.value.outputTokensPerRow.max, 900);
  assert.equal(p8.value.outputTokensPerRow.min, 100);
  assert.equal(p8.value.worstCallVsMaxTokens, 900 / 64000);
  assert.equal(p8.value.usd, 0.03);
  assert.equal(p8.value.usdExtrapolated, (0.03 / 2) * TOTAL_ROWS);
});

test('P9 extrapolates the review_confidence distribution to 2,728', () => {
  const s = state([obj(1), obj(2), obj(3), obj(4)]);
  s.batches[0].routed.forEach((r, i) => { r.review_confidence = i < 3 ? 3 : 1; });
  const p9 = byId(pilotChecks(s)).P9;
  assert.deepEqual(p9.value.distribution, { 1: 1, 3: 3 });
  assert.equal(p9.value.extrapolated['3'], Math.round(0.75 * TOTAL_ROWS));
});

test('P10 fails when no row changed a long vowel, passes once enough did', () => {
  const same = [obj(1), obj(2), obj(3), obj(4)];
  assert.equal(byId(pilotChecks(state(same))).P10.pass, false);
  const flipped = [obj(1, { romanization: { value: 'biit', conf: 'H', changed: true } }),
    obj(2), obj(3), obj(4)];
  const p10 = byId(pilotChecks(state(flipped))).P10;
  assert.equal(p10.value.flipped, 1);
  assert.equal(p10.pass, true); // 0.25 clears the 0.05 threshold
});

// --- report ----------------------------------------------------------------

test('buildReport totals the run and renderReport prints every check', () => {
  const r = buildReport({ ...state([obj(1)]), stopReason: 'completed', plannedBatches: 46 });
  assert.equal(r.totals.rows_staged, 1);
  assert.equal(r.totals.usd_spent, 0.01);
  assert.equal(r.totals.spend_cap_usd, 2.5);
  const text = renderReport(r);
  for (const id of ['P1', 'P5', 'P10']) assert.match(text, new RegExp(`\\b${id}\\b`));
  assert.match(text, /of cap \$2\.50/);
});
