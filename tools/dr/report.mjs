// Pilot checks, cost metering and the run report (dr-runner-spec.md §3, §8;
// dr-scoped-pass.md §6 for P9 and P10). Pure: takes the run state run.mjs
// accumulates, returns numbers and text. No network, no file writes.

import { POS_VALUES, REGISTER_VALUES, FORM_ORIGIN_VALUES } from './validate.mjs';

// Anthropic list prices, USD per million tokens. Cache writes are the 1.25x
// 5-minute-TTL rate (judge.mjs sends `cache_control: {type: 'ephemeral'}`,
// which is the 5m TTL); the 1h rate is 2x and only bills if a future change
// asks for it. Cache reads are 0.1x base input.
// A model with no row here throws rather than being priced at zero: the spend
// cap is a halt condition, so a guessed price is worse than a stopped run.
export const PRICING_USD_PER_MTOK = {
  'claude-opus-5': { input: 5.00, output: 25.00, cacheWrite5m: 6.25, cacheWrite1h: 10.00, cacheRead: 0.50 },
};

// dr-spec.md §7 F3: verbs >= 30% of levels 1-2 combined. The external signal
// (learnlevantine essentials) is 40%. §8 calls P6 a "range"; the spec states
// only the floor, so that is what is asserted and 40% is reported beside it.
export const P6_VERB_FLOOR = 0.30;
export const P6_EXTERNAL_SIGNAL = 0.40;
// P5: a batch whose level values collapse to 1 or 2 distinct values fails.
export const P5_MIN_DISTINCT_LEVELS = 3;
// P10 (D210) is "at or near zero" in the spec, which names no number. This is
// the runner's threshold, not the spec's: a flip rate below it reads as the
// model carrying the conflated source value through. Change it in one place.
export const P10_MIN_FLIP_RATE = 0.05;

export const TOTAL_ROWS = 2728;

export function priceUsage(usage = {}, model) {
  const p = PRICING_USD_PER_MTOK[model];
  if (!p) {
    throw new Error(`report: no price for model ${model}. Add it to PRICING_USD_PER_MTOK ` +
      'rather than metering a run against a guessed figure.');
  }
  const write5m = usage.cache_creation?.ephemeral_5m_input_tokens
    ?? (usage.cache_creation ? 0 : usage.cache_creation_input_tokens ?? 0);
  const write1h = usage.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  const parts = {
    input: (usage.input_tokens ?? 0) * p.input,
    cacheWrite: write5m * p.cacheWrite5m + write1h * p.cacheWrite1h,
    cacheRead: (usage.cache_read_input_tokens ?? 0) * p.cacheRead,
    output: (usage.output_tokens ?? 0) * p.output,
  };
  const usd = (parts.input + parts.cacheWrite + parts.cacheRead + parts.output) / 1e6;
  return {
    usd,
    usdInput: parts.input / 1e6,
    usdCacheWrite: parts.cacheWrite / 1e6,
    usdCacheRead: parts.cacheRead / 1e6,
    usdOutput: parts.output / 1e6,
  };
}

// The five D47 long vowels. oo/uu and ee/ii are the conflated pairs (D210);
// aa is listed so it is recognised as a long vowel and never counted as a flip.
const LONG_VOWELS = ['aa', 'ee', 'ii', 'oo', 'uu'];
const CONFLATION_CLASS = { aa: 'A', ee: 'I', ii: 'I', oo: 'U', uu: 'U' };

export function longVowelSeq(s) {
  const out = [];
  const lower = String(s ?? '').toLowerCase();
  for (let i = 0; i < lower.length - 1; i++) {
    const pair = lower.slice(i, i + 2);
    if (LONG_VOWELS.includes(pair)) { out.push(pair); i++; }
  }
  return out;
}

/**
 * P10's counter: did the model change a long vowel to its conflated partner?
 * Same-length sequences compare position by position. Different lengths (the
 * romanization was rewritten, not just re-vowelled) fall back to the split
 * inside each conflation class: same total, different oo/uu or ee/ii share.
 * A detector of pass-through, never of accuracy — there is no ground truth.
 */
export function isVowelLengthFlip(source, produced) {
  const a = longVowelSeq(source);
  const b = longVowelSeq(produced);
  if (a.length === 0 && b.length === 0) return false;
  if (a.length === b.length) {
    return a.some((t, i) => t !== b[i] && CONFLATION_CLASS[t] === CONFLATION_CLASS[b[i]]);
  }
  const count = (seq, t) => seq.filter((x) => x === t).length;
  return [['oo', 'uu'], ['ee', 'ii']].some(([x, y]) =>
    count(a, x) + count(a, y) === count(b, x) + count(b, y) && count(a, x) !== count(b, x));
}

export function distribution(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return Object.fromEntries([...counts.entries()].sort((p, q) => (p[0] > q[0] ? 1 : -1)));
}

// P8 is reported as a distribution, not a mean: thinking is billed as output and
// varies several-fold per row, so the mean hides the worst case max_tokens must clear.
export function spread(values) {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const at = (q) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
  return { min: s[0], p50: at(0.5), p90: at(0.9), max: s[s.length - 1],
    mean: s.reduce((a, b) => a + b, 0) / s.length };
}

const check = (id, label, pass, value) => ({ id, label, pass, value });

/**
 * P1-P10 over everything staged in this run. `state` is what run.mjs carries:
 * { batches: [{ requestedIds, firstPass, unresolvedIds, objects, routed,
 *   sourceRomanization, calls, staged }], config }.
 */
export function pilotChecks(state) {
  const batches = state.batches ?? [];
  const objects = batches.flatMap((b) => b.objects ?? []);
  const routed = batches.flatMap((b) => b.routed ?? []);
  const calls = batches.flatMap((b) => b.calls ?? []);
  const requested = batches.reduce((n, b) => n + (b.requestedIds?.length ?? 0), 0);

  const firstPassClean = batches.every((b) => (b.firstPass?.missingIds?.length ?? 0) === 0 &&
    (b.firstPass?.extraIds?.length ?? 0) === 0 && (b.firstPass?.duplicateIds?.length ?? 0) === 0);
  const unresolved = batches.flatMap((b) => b.unresolvedIds ?? []);

  const badEnums = objects.filter((o) => !POS_VALUES.includes(o.pos) ||
    !REGISTER_VALUES.includes(o.register) || !FORM_ORIGIN_VALUES.includes(o.form_origin) ||
    !Number.isInteger(o.level) || o.level < 1 || o.level > 5);
  const missingLevel = objects.filter((o) => !Number.isInteger(o.level) ||
    typeof o.level_reason !== 'string' || !o.level_reason || !['H', 'M', 'L'].includes(o.level_conf));

  const levels = objects.map((o) => o.level).filter(Number.isInteger);
  const lowBand = objects.filter((o) => o.level === 1 || o.level === 2);
  const verbShare = lowBand.length ? lowBand.filter((o) => o.pos === 'verb').length / lowBand.length : null;

  const held = routed.filter((r) => r.status === 'held').length;
  const nativeCheck = objects.filter((o) => o.native_check === true).length;

  const outPerRow = calls.filter((c) => c.rows > 0).map((c) => (c.usage?.output_tokens ?? 0) / c.rows);
  const outPerCall = calls.map((c) => c.usage?.output_tokens ?? 0);
  // The split the B4 bullet recorded as owed: it decides any effort or output
  // -format question, since thinking dominates output and is format-invariant.
  // Only a transport that reports it fills this in; null elsewhere, not zero.
  const thinkingPerCall = calls.map((c) => c.usage?.output_tokens_details?.thinking_tokens)
    .filter((n) => typeof n === 'number');
  const thinkingTotal = thinkingPerCall.reduce((n, t) => n + t, 0);
  const outputTotal = outPerCall.reduce((n, t) => n + t, 0);
  // Preamble the CLI transport pays per call, cold (created) vs warm (read).
  const cacheCreate = calls.map((c) => c.usage?.cache_creation_input_tokens ?? 0);
  const cacheRead = calls.map((c) => c.usage?.cache_read_input_tokens ?? 0);
  const usd = calls.reduce((n, c) => n + (c.usd ?? 0), 0);
  const usdPerRow = objects.length ? usd / objects.length : null;

  const scores = routed.map((r) => r.review_confidence);
  const scoreDist = distribution(scores);
  const scoreExtrapolated = Object.fromEntries(Object.entries(scoreDist)
    .map(([k, n]) => [k, Math.round((n / (scores.length || 1)) * TOTAL_ROWS)]));

  const flips = batches.flatMap((b) => (b.objects ?? []).filter((o) =>
    isVowelLengthFlip(b.sourceRomanization?.[o.id], o.romanization?.value)));
  const flipRate = objects.length ? flips.length / objects.length : null;

  return [
    check('P1', 'every requested id returned exactly once (first response)', firstPassClean,
      { requested, batches: batches.map((b) => b.firstPass) }),
    check('P2', 'schema conformance after at most 1 repair retry', unresolved.length === 0,
      { unresolvedIds: unresolved, repairCalls: batches.reduce((n, b) => n + (b.repairAttempts ?? 0), 0) }),
    check('P3', 'pos/register/form_origin/level are enum values only', badEnums.length === 0,
      { violations: badEnums.map((o) => o.id) }),
    check('P4', 'every row carries level, level_reason, level_conf', missingLevel.length === 0,
      { violations: missingLevel.map((o) => o.id) }),
    check('P5', `level spread is at least ${P5_MIN_DISTINCT_LEVELS} distinct values`,
      new Set(levels).size >= P5_MIN_DISTINCT_LEVELS, { levels: distribution(levels) }),
    check('P6', `verb share of level 1-2 rows >= ${P6_VERB_FLOOR} (external signal ${P6_EXTERNAL_SIGNAL})`,
      verbShare === null ? null : verbShare >= P6_VERB_FLOOR,
      { verbShare, lowBandRows: lowBand.length, externalSignal: P6_EXTERNAL_SIGNAL }),
    check('P7', 'held rate and native_check rate (recorded, not a gate)', null,
      { heldRate: routed.length ? held / routed.length : null, held, rows: routed.length,
        nativeCheckRate: objects.length ? nativeCheck / objects.length : null, nativeCheck }),
    check('P8', 'cost and output tokens per row, extrapolated to 2,728 (recorded)', null,
      { outputTokensPerRow: spread(outPerRow), outputTokensPerCall: spread(outPerCall),
        maxTokensConfigured: state.config?.maxTokens ?? null,
        worstCallVsMaxTokens: state.config?.maxTokens
          ? (spread(outPerCall)?.max ?? 0) / state.config.maxTokens : null,
        thinkingTokens: thinkingPerCall.length ? {
          total: thinkingTotal, perCall: spread(thinkingPerCall),
          shareOfOutput: outputTotal ? thinkingTotal / outputTotal : null,
        } : null,
        preambleTokens: { created: spread(cacheCreate), read: spread(cacheRead) },
        metered: [...new Set(calls.map((c) => c.metered ?? 'price-table'))],
        usd, usdPerRow, usdExtrapolated: usdPerRow === null ? null : usdPerRow * TOTAL_ROWS }),
    check('P9', 'review_confidence distribution, extrapolated to 2,728 (recorded)', null,
      { distribution: scoreDist, extrapolated: scoreExtrapolated, rows: scores.length }),
    check('P10', `vowel-length flip rate >= ${P10_MIN_FLIP_RATE} (pass/fail on the prompt, D210)`,
      flipRate === null ? null : flipRate >= P10_MIN_FLIP_RATE,
      { flipRate, flipped: flips.length, rows: objects.length, flippedIds: flips.map((o) => o.id) }),
  ];
}

export function buildReport(state) {
  const checks = pilotChecks(state);
  const calls = (state.batches ?? []).flatMap((b) => b.calls ?? []);
  return {
    run_id: state.runId,
    generated_at: state.finishedAt ?? new Date().toISOString(),
    stop_reason: state.stopReason ?? null,
    stub_judge: state.config?.judgeFrom ?? null,
    config: state.config ?? {},
    totals: {
      planned_batches: state.plannedBatches ?? null,
      batches_run: (state.batches ?? []).length,
      rows_skipped_resume: state.resumedSkipped ?? 0,
      rows_staged: (state.batches ?? []).reduce((n, b) => n + (b.staged ?? 0), 0),
      model_calls: calls.length,
      usd_spent: calls.reduce((n, c) => n + (c.usd ?? 0), 0),
      spend_cap_usd: state.config?.spendCapUsd ?? null,
    },
    checks,
    batches: (state.batches ?? []).map((b) => ({
      batch_no: b.batchNo, requested: b.requestedIds?.length ?? 0, staged: b.staged ?? 0,
      repair_attempts: b.repairAttempts ?? 0, unresolved_ids: b.unresolvedIds ?? [],
      usd: (b.calls ?? []).reduce((n, c) => n + (c.usd ?? 0), 0),
    })),
  };
}

export function renderReport(report) {
  const mark = (p) => (p === null ? '—' : p ? 'PASS' : 'FAIL');
  const lines = [
    `DR run ${report.run_id}`,
    `stop reason: ${report.stop_reason ?? 'completed'}`,
    report.stub_judge ? `STUB JUDGE: ${report.stub_judge} — not a real pass` : null,
    report.config?.stage === false
      ? 'NO-STAGE: staging rows were built and counted, not written to dictionary_review' : null,
    `batches ${report.totals.batches_run}/${report.totals.planned_batches ?? '?'}  ` +
      `staged ${report.totals.rows_staged}  skipped(resume) ${report.totals.rows_skipped_resume}`,
    `spend $${report.totals.usd_spent.toFixed(4)} of cap $${Number(report.totals.spend_cap_usd).toFixed(2)}`,
    '',
  ].filter((l) => l !== null);
  for (const c of report.checks) {
    lines.push(`${c.id} ${mark(c.pass).padEnd(4)} ${c.label}`);
    lines.push(`      ${JSON.stringify(c.value)}`);
  }
  return lines.join('\n');
}
