#!/usr/bin/env node
// CLI entry, batch loop, resume and stop conditions (dr-runner-spec.md §3, §5-§7).
//
// No code path here writes `dictionary`. The only Supabase write is db.upsertReview,
// which names `dictionary_review`. Promotion stays a hand-run SQL step behind G1-G8.
//
// Owns one environment step nothing else can (§2): Node's built-in fetch ignores
// HTTPS_PROXY unless the process started with --use-env-proxy, and that flag is
// read at process start, so the entry point re-execs itself when it is absent.

import { spawnSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildConfig, PROMPT_DOC_PATH, ROMANIZATION_MAP_PATH, RUNS_DIR, REPO_ROOT } from './config.mjs';
import { buildPlan } from './sample.mjs';
import { buildDuplicateIndex, applyRuleFix } from './rulefix.mjs';
import { loadPromptDoc, loadRomanizationMap, buildBatchMessage } from './prompt.mjs';
import { ENUMS_TEXT, LEVEL_RUBRIC_TEXT } from './prompt-content.mjs';
import { judge as anthropicJudge, JUDGE_MODEL, DEFAULT_MAX_TOKENS, DEFAULT_EFFORT } from './judge.mjs';
import { validateBatch } from './validate.mjs';
import { routeRow } from './route.mjs';
import { readDictionary, stagedIds, upsertReview } from './db.mjs';
import { buildReport, renderReport, priceUsage } from './report.mjs';

export const MAX_CONSECUTIVE_BATCH_FAILURES = 2;

// --- environment (§2) ------------------------------------------------------

export function needsProxyReexec(env = process.env, execArgv = process.execArgv) {
  if (env.DR_PROXY_REEXEC === '1') return false; // already the child; never loop
  if (!(env.HTTPS_PROXY ?? env.https_proxy)) return false;
  return env.NODE_USE_ENV_PROXY !== '1' && !execArgv.includes('--use-env-proxy');
}

function reexecWithProxy(argv) {
  const res = spawnSync(process.execPath, ['--use-env-proxy', fileURLToPath(import.meta.url), ...argv],
    { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1', DR_PROXY_REEXEC: '1' } });
  process.exit(res.status ?? 1);
}

// --- CLI -------------------------------------------------------------------

const FLAGS = ['run-id', 'seed', 'batch-size', 'spend-cap', 'transport', 'max-batches',
  'model', 'effort', 'max-tokens', 'rows-from', 'judge-from', 'runs-dir'];
const SWITCHES = ['no-stage', 'help'];

export function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i].replace(/^--/, '');
    if (SWITCHES.includes(name)) { opts[name] = true; continue; }
    if (!FLAGS.includes(name)) throw new Error(`run: unknown argument ${argv[i]}`);
    if (argv[i + 1] === undefined) throw new Error(`run: --${name} needs a value`);
    opts[name] = argv[++i];
  }
  if (opts.help) return opts;
  // config.mjs refuses a default spend cap; the figure is the caller's
  // (D228: 2.50 pilot, 20.00 full loop). Never defaulted here either.
  if (opts['spend-cap'] === undefined) {
    throw new Error('run: --spend-cap is required. D228: 2.50 for the pilot, 20.00 for the full loop.');
  }
  // An alternative judge is a dry-run seam; it must never reach the staging table.
  if (opts['judge-from'] && !opts['no-stage']) {
    throw new Error('run: --judge-from requires --no-stage. Stub output does not belong in dictionary_review.');
  }
  return opts;
}

const num = (v, fallback) => (v === undefined ? fallback : Number(v));

function maxBatchesOf(v) {
  if (v === undefined) return Infinity;
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`run: --max-batches must be a positive integer, got ${v}`);
  return n;
}

export function configFrom(opts) {
  const spendCapUsd = Number(opts['spend-cap']);
  if (!Number.isFinite(spendCapUsd) || spendCapUsd <= 0) {
    throw new Error(`run: --spend-cap must be a positive number, got ${opts['spend-cap']}`);
  }
  return {
    ...buildConfig({ runId: opts['run-id'], seed: num(opts.seed), transport: opts.transport,
      batchSize: num(opts['batch-size']), spendCapUsd }),
    model: opts.model ?? JUDGE_MODEL,
    effort: opts.effort ?? DEFAULT_EFFORT,
    maxTokens: num(opts['max-tokens'], DEFAULT_MAX_TOKENS),
    maxBatches: maxBatchesOf(opts['max-batches']),
    rowsFrom: opts['rows-from'] ?? null,
    judgeFrom: opts['judge-from'] ?? null,
    stage: !opts['no-stage'],
    runsDir: opts['runs-dir'] ?? RUNS_DIR,
  };
}

// --- one batch -------------------------------------------------------------

// §7.1: rule-fix writes no separate row — its field changes ride into the same
// single insert under payload.rule_fix. §7.2 puts per-field status under
// payload.routing; dr-scoped-pass.md §6 adds payload.review_confidence.
export function stagingRow({ runId, batchNo, ruleFix, obj, routed }) {
  return {
    run_id: runId,
    dictionary_id: obj.id,
    batch_no: batchNo,
    status: routed.status,
    // the model object verbatim, never edited to make the schema pass (§7.5)
    payload: { model: obj, rule_fix: ruleFix ?? null, routing: routed.routing,
      review_confidence: routed.review_confidence },
  };
}

async function callJudge(ctx, rows, batchNo, batch) {
  const { cfg, deps, totalBatches } = ctx;
  const message = deps.message(rows, batchNo, totalBatches);
  const result = await deps.judge(rows, { transport: cfg.transport, message, model: cfg.model,
    effort: cfg.effort, maxTokens: cfg.maxTokens });
  // A transport that meters itself wins over D243's table (D260): the CLI's usage
  // blob counts harness preamble tokens, so pricing it would over-report the run.
  const usd = result.usd ?? priceUsage(result.usage, result.model ?? cfg.model).usd;
  batch.calls.push({ rows: rows.length, usage: result.usage, usd, stopReason: result.stopReason,
    metered: result.usd !== undefined ? 'transport' : 'price-table', sessionId: result.sessionId });
  return result;
}

async function runBatch(ctx, batchNo, ids) {
  const { cfg, deps, rowsById, ruleFixById } = ctx;
  const batch = { batchNo, requestedIds: ids, calls: [], objects: [], routed: [], staged: 0,
    repairAttempts: 0, unresolvedIds: [], sourceRomanization: {} };
  for (const id of ids) batch.sourceRomanization[id] = rowsById.get(id)?.romanization ?? null;
  const inputFor = (list) => list.map((id) => ({ ...rowsById.get(id), ...ruleFixById.get(id).fixed }));

  // Only requested ids are ever staged, and only the first valid copy of one:
  // an id the model volunteered has no source row behind it, and a duplicate is
  // a P1 failure, not a licence to pick whichever copy came last.
  const keep = new Map();
  const collect = (wanted, objects, { rowResults }) => {
    const asked = new Set(wanted);
    for (const obj of objects) {
      if (asked.has(obj?.id) && !keep.has(obj.id) && rowResults.get(obj.id)?.valid) keep.set(obj.id, obj);
    }
  };

  const first = await callJudge(ctx, inputFor(ids), batchNo, batch);
  const unparsed = first.objects?.unparsed ?? [];
  if (unparsed.length > 0) {
    batch.unparsed = unparsed.length;
    deps.log(`batch ${batchNo}: ${unparsed.length} object(s) did not parse; the repair retry will re-request them. ` +
      `first: ${unparsed[0].message} in ${unparsed[0].slice.slice(0, 200)}`);
  }
  const seen = validateBatch(ids, first.objects);
  batch.firstPass = { missingIds: seen.missingIds, extraIds: seen.extraIds, duplicateIds: seen.duplicateIds };
  collect(ids, first.objects, seen);

  // §7.5: one repair retry for anything missing or invalid, re-requested as its own
  // call. Still bad after that and the row is left unstaged, so resume picks it up.
  // Nothing is dropped silently and nothing is patched to pass.
  const bad = ids.filter((id) => !keep.has(id));
  const spentIncludingThisBatch = ctx.spent() + batch.calls.reduce((n, c) => n + c.usd, 0);
  if (bad.length > 0 && spentIncludingThisBatch < cfg.spendCapUsd) {
    batch.repairAttempts = 1;
    const retry = await callJudge(ctx, inputFor(bad), batchNo, batch);
    collect(bad, retry.objects, validateBatch(bad, retry.objects));
  }

  batch.unresolvedIds = ids.filter((id) => !keep.has(id));
  if (batch.unresolvedIds.length > 0) {
    deps.log(`batch ${batchNo}: unresolved after repair, left unstaged: ${batch.unresolvedIds.join(', ')}`);
  }

  const staging = [];
  for (const [id, obj] of keep) {
    const routed = routeRow(obj);
    batch.objects.push(obj);
    batch.routed.push({ id, ...routed });
    staging.push(stagingRow({ runId: cfg.runId, batchNo, ruleFix: ruleFixById.get(id), obj, routed }));
  }
  if (staging.length > 0) {
    await deps.upsertReview(staging); // the only Supabase write in tools/dr
    batch.staged = staging.length;
  }
  return batch;
}

// --- the loop --------------------------------------------------------------

export async function runLoop(cfg, deps) {
  const { rows, total } = await deps.readDictionary();
  const duplicates = buildDuplicateIndex(rows);
  const state = { runId: cfg.runId, config: cfg, startedAt: new Date().toISOString(),
    totalRows: total, batches: [], stopReason: null };
  const plan = buildPlan(rows, cfg);
  state.plannedBatches = plan.batches.length;

  // Resume keys off (run_id, dictionary_id): ids already staged for this run are
  // skipped, so a killed session restarts at the first unstaged row (§5).
  const already = new Set(cfg.stage ? await deps.stagedIds(cfg.runId) : []);
  state.resumedSkipped = already.size;
  const pending = plan.batches.map((ids) => ids.filter((id) => !already.has(id)));

  const spent = () => state.batches.flatMap((b) => b.calls).reduce((n, c) => n + c.usd, 0);
  const ctx = { cfg, deps, spent, totalBatches: plan.batches.length,
    rowsById: new Map(rows.map((r) => [r.id, r])),
    ruleFixById: new Map(rows.map((r) => [r.id, applyRuleFix(r, duplicates.get(r.id) ?? [])])) };

  let consecutiveFailures = 0;
  let run = 0;
  for (let i = 0; i < pending.length; i++) {
    if (pending[i].length === 0) continue;
    if (run >= cfg.maxBatches) { state.stopReason = 'max-batches'; break; }
    if (spent() >= cfg.spendCapUsd) { state.stopReason = 'spend-cap'; break; }
    const batch = await runBatch(ctx, i + 1, pending[i]); // a Supabase non-2xx throws out of here
    state.batches.push(batch);
    run++;
    deps.log(`batch ${i + 1}: staged ${batch.staged}/${pending[i].length}, spend $${spent().toFixed(4)}`);
    consecutiveFailures = batch.staged === 0 ? consecutiveFailures + 1 : 0;
    if (consecutiveFailures >= MAX_CONSECUTIVE_BATCH_FAILURES) {
      state.stopReason = 'two-consecutive-batch-failures';
      break;
    }
  }
  state.stopReason ??= 'completed';
  state.finishedAt = new Date().toISOString();
  return state;
}

// --- artefacts and wiring --------------------------------------------------

export async function writeArtefacts(cfg, state) {
  const dir = path.join(cfg.runsDir, cfg.runId);
  await mkdir(dir, { recursive: true });
  // §5: the seed alone reproduces the plan, so a restart needs no plan file.
  await writeFile(path.join(dir, 'manifest.json'), `${JSON.stringify({
    run_id: cfg.runId, seed: cfg.seed, batch_size: cfg.batchSize, transport: cfg.transport,
    model: cfg.model, effort: cfg.effort, max_tokens: cfg.maxTokens, spend_cap_usd: cfg.spendCapUsd,
    stage: cfg.stage, judge_from: cfg.judgeFrom, rows_from: cfg.rowsFrom,
    // repo-relative: the manifest commits, and an absolute path names a container
    // that no longer exists by the time anyone reads it.
    prompt_doc: path.relative(REPO_ROOT, PROMPT_DOC_PATH),
    romanization_map: path.relative(REPO_ROOT, ROMANIZATION_MAP_PATH),
    started_at: state.startedAt, finished_at: state.finishedAt ?? null, stop_reason: state.stopReason,
  }, null, 2)}\n`);
  const report = buildReport(state);
  await writeFile(path.join(dir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(path.join(dir, 'report.txt'), `${renderReport(report)}\n`);
  return { dir, report };
}

async function buildDeps(cfg) {
  const [docText, romanization] = await Promise.all([
    loadPromptDoc(PROMPT_DOC_PATH), loadRomanizationMap(ROMANIZATION_MAP_PATH)]);
  let judge = anthropicJudge;
  if (cfg.judgeFrom) {
    const mod = await import(pathToFileURL(path.resolve(cfg.judgeFrom)).href);
    judge = mod.judge ?? mod.default;
    if (typeof judge !== 'function') throw new Error(`run: ${cfg.judgeFrom} exports no judge function`);
  }
  return {
    judge,
    message: (rows, batchIndex, totalBatches) => buildBatchMessage(docText, rows, {
      batchIndex, totalBatches, enums: ENUMS_TEXT, levelRubric: LEVEL_RUBRIC_TEXT, romanization }),
    readDictionary: cfg.rowsFrom
      ? async () => { const rows = JSON.parse(await readFile(cfg.rowsFrom, 'utf8')); return { rows, total: rows.length }; }
      : readDictionary,
    stagedIds,
    upsertReview: cfg.stage ? upsertReview : async () => ({ staged: 0, resolution: 'no-stage' }),
    log: (m) => console.error(m),
  };
}

const USAGE = `usage: node tools/dr/run.mjs --spend-cap <usd> [options]
  --spend-cap <usd>   required, a halt not a warning. D228: 2.50 pilot, 20.00 full loop
  --run-id <id>       resume an existing run (omit for a new one)   --seed <int>
  --batch-size <n>    default 60          --max-batches <n>   pilot: 1
  --transport <t>     anthropic-direct | edge-function
  --model <m>  --effort <e>  --max-tokens <n>   judge overrides
  --rows-from <file>  source rows from JSON instead of Supabase (dry run)
  --judge-from <file> stub judge module instead of the seam; requires --no-stage
  --no-stage          no Supabase write; count staging rows only
  --runs-dir <dir>    default <repo>/runs`;

export async function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  if (opts.help) { console.log(USAGE); return 0; }
  const cfg = configFrom(opts);
  const deps = await buildDeps(cfg);
  let state = { runId: cfg.runId, config: cfg, startedAt: new Date().toISOString(), batches: [] };
  try {
    state = await runLoop(cfg, deps);
  } catch (err) {
    // Halt and report: never continue past a failure (§7.6).
    state.stopReason = `halted: ${err.message}`;
    state.finishedAt = new Date().toISOString();
    const { dir } = await writeArtefacts(cfg, state);
    console.error(`${err.stack ?? err.message}\nrun halted. artefacts: ${dir}`);
    return 1;
  }
  const { dir, report } = await writeArtefacts(cfg, state);
  console.log(renderReport(report));
  console.error(`artefacts: ${dir}`);
  return report.checks.some((c) => c.pass === false) ? 2 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (needsProxyReexec()) reexecWithProxy(process.argv.slice(2));
  else main().then((c) => process.exit(c), (e) => { console.error(e.stack ?? e.message); process.exit(1); });
}
