# DR batch runner spec

Status: approved chat 15, not yet built. Commit to `mharb92/hoopoe` at `docs/dr/dr-runner-spec.md`.

Sits under the frozen DR docs. `dr-spec.md` owns the construct, rubric and acceptance floors. `dr-prompt.md` owns the batch prompt, JSON contract, batching rule and rule-fix list. `dr-runbook.md` owns the staging DDL, run order, gates G1-G8 and promotion SQL. This file owns only the machine that executes them, and it never restates their contents.

Where the frozen docs contradict each other or cannot be executed as written, the resolution is recorded in §7 with the reason.

---

## 1. Scope

Reads `dictionary` from `pniwgnjljpkiimssortp`, runs the deterministic rule-fix pass, sends stratified batches to Opus, validates and routes each returned row, and writes one staging row per dictionary row per run.

**It has no code path that writes `dictionary`.** Promotion stays a reviewed SQL step run by hand in the browser SQL Editor behind G1-G8. A bug in the runner can cost a run, never the dictionary.

---

## 2. Where it runs

Claude Code cloud session on the `hoopoe-dr` environment. Node ESM, zero runtime dependencies: built-in `fetch`, `node:test`, `node:crypto`. No package install step, so nothing to break in a restarted session.

Supabase auth uses the stored credential shape: `Authorization: Bearer <key>` and `apikey: <key>`, same value, `apikey` prefix empty. The session never sees the key.

Anthropic access for the pilot is an environment variable. The full 2,728-row loop routes through the `claude` edge function once it is deployed (open §J item). Both sit behind the same seam, so the swap is a config change. The variable is `DR_ANTHROPIC_KEY`, read in `judge.mjs` with no fallback; it is rotated at the promotion gate (`dr-scoped-pass.md` §2), because an environment variable is readable by anyone using the environment.

**Node's built-in `fetch` ignores `HTTPS_PROXY`.** The environment injects the Supabase credential at the proxy, so a process started without `NODE_USE_ENV_PROXY=1` (or `--use-env-proxy`) reaches Supabase uncredentialed and is answered 401 `UNAUTHORIZED_MISSING_API_KEY` — which reads as a credential fault and is not one. `db.mjs` checks this before every request and names the real cause. Because the flag is only read at process start, the entry point re-execs itself with it when it is absent: a missing env var must not be something the operator has to remember. `api.anthropic.com` bypasses the proxy and is unaffected.

---

## 3. Modules

`tools/dr/`, one job each, each under ~150 lines.

| file | job |
|---|---|
| `run.mjs` | CLI entry, batch loop, resume, stop conditions |
| `config.mjs` | run id, seed, batch size, spend cap, transport choice |
| `db.mjs` | PostgREST read of `dictionary`, upsert of `dictionary_review` |
| `sample.mjs` | seeded batch plan over all ids |
| `rulefix.mjs` | the deterministic pass from `dr-prompt.md` |
| `prompt.mjs` | builds the batch message from the frozen prompt file |
| `judge.mjs` | the model seam |
| `stream.mjs` | decodes one streamed model response (§7.9) |
| `validate.mjs` | JSON contract check, one row at a time |
| `route.mjs` | confidence and `native_check` to status |
| `report.mjs` | pilot checks, acceptance floors, cost |

`runs/<run_id>/` holds the manifest and reports.

---

## 4. The model seam

One function, one shape:

```
judge(rows, cfg) -> array of row objects
```

Transport is config: `anthropic-direct` for the pilot, `edge-function` for the full loop. Nothing above the seam knows which is in use.

The judging model is named in the API call inside `judge.mjs`, independent of whichever model orchestrates the session. A Sonnet session calls Opus per batch.

Two settings live with it. Depth is `output_config.effort`, default `high`: the judging model removed `temperature`, runs adaptive thinking by default, and bills thinking as output, so there is no determinism knob and P8 measures a number the §7.4 estimate predates. The system prompt is sent as one cached block, because it is byte-identical across every batch of a run while the rows after it are not; caching changes what is billed, never what is sent.

---

## 5. Batch plan and resume

The plan is a seeded shuffle of all dictionary ids chunked in order. The seed is recorded in the run manifest, so a restart reproduces the identical plan from the seed alone. There is no plan file to lose or desync.

Resume keys off `(run_id, dictionary_id)`. On start the runner reads the ids already staged for the run and skips them. A killed session restarts at the first unstaged row. Staging inserts use `on_conflict` do-nothing, so a retry after a partial write is safe.

Two batch types, per `dr-prompt.md`:

- **sampled**: stratified random draw across all categories in proportion, default 120 rows, judged in one call.
- **grouped**: the social-formula set and the closed sets, which must be seen whole. The full set is sent as compact reference context (id, arabic, english only) and judgements are requested for a sliding slice, default 60 rows per call, until the set is done.

---

## 6. Per-batch sequence

1. Fetch the batch rows.
2. Rule-fix in memory. Output feeds the rows sent to the model and is carried into the staging payload.
3. Build the prompt from `dr-prompt.md`.
4. Call the seam.
5. Validate every returned object against the JSON contract.
6. Route each row to `auto` or `held`.
7. Upsert one staging row per dictionary row, with the model object verbatim.
8. Log tokens, cost and timings to the run report.

---

## 7. Resolutions

Recorded because they diverge from, or make executable, what the frozen docs say.

**7.1 Rule-fix writes no separate row.** The runbook's step 3 and step 4 both insert every row, which `unique (run_id, dictionary_id)` forbids. Rule-fix runs in memory per batch, feeds the model input, and its field changes are stored under `payload.rule_fix` in the same single insert. Rule-fix is deterministic, so a crash loses nothing recomputable.

**7.2 Row status is coarse, field routing is recorded.** `dr-prompt.md` routes per field; the promotion SQL gates on one row status. `status = auto` only when every core field is H, `native_check` is false, and there is no pair claim. Otherwise `held`. Per-field detail is written to `payload.routing` so the adjudication worksheet surfaces only the disputed fields. The frozen promotion SQL stays valid unchanged.

Consequence: a row with one weak field holds its strong fields until adjudication. Whether that is acceptable depends on the held rate, which is unknown until the pilot. See §10.

**7.3 Grouped batches are sliced.** 272 judgement objects do not fit in one response. Full set as context, judgements in slices, per §5. Pairs stay findable because both halves remain in view for every call.

**7.4 Batch size is config.** 120 is a sampling decision, not an output-budget decision. Output runs roughly 150-250 tokens per row with the reason strings, so truncation is a live failure mode. Default stays 120, the pilot measures real output tokens, and the value drops without a spec change if there is no headroom.

**7.5 Nothing is dropped or patched.** A row failing validation gets one repair retry. If it fails again it is left with no staging entry, so resume picks it up, and it is logged with the raw response. Rows missing from a batch response are re-requested once individually. The runner never edits model output to make the schema pass.

**7.6 Stop conditions.** Halt and report on any non-2xx from Supabase, two consecutive batch failures, or the configured spend cap. Never continue past a failure.

**7.7 Artefacts.** The run manifest and reports commit to the repo. Raw model output lives only in `payload`, verbatim, never as files in git.

**7.8 Staging conflicts do nothing, they do not merge.** `dr-build-brief.md` B2 calls the write an "upsert", which reads as merge-duplicates. §5 is the behaviour: `on_conflict` do-nothing. Resume reads the ids already staged and skips them, so in normal operation a conflict never arises; the only way to reach one is a retry racing a partial write, where not overwriting the staged row is the point. A genuine re-judgement takes a **new `run_id`**, which keeps both judgements comparable — merging would destroy the earlier one with no record. `upsertReview` keeps a `merge: true` option for a deliberate re-stage, unused by the loop.

**7.9 The model call is streamed, and decoding it is an eleventh module.** A batch's output runs to tens of thousands of tokens — the judging model bills thinking as output, and thinking varies several-fold by row — so a non-streamed request that large reaches the HTTP timeout before the model finishes, and a batch that hits `max_tokens` fails outright rather than degrading. Streaming is transport only: it changes nothing about what is sent, cached or returned. Decoding the wire format is a different job from being the seam, and inlining it pushed `judge.mjs` 40% past the size rule, so it is `stream.mjs` and §3's map gains a row. `max_tokens` default is 64,000, set clear of the worst case rather than at it.

---

## 8. Pilot gate

One sampled batch, then stop. The loop is not unlocked until these pass.

F1, F2, F6 and F7 are global floors over 2,728 rows and are not checkable on 120. They run after the full pass, as `dr-spec.md` specifies.

| # | pilot check |
|---|---|
| P1 | every requested id returned exactly once |
| P2 | 100% schema conformance after at most 1 repair retry |
| P3 | `register`, `form_origin`, `pos`, `level` contain only enum values |
| P4 | every row carries `level`, `level_reason`, `level_conf` |
| P5 | the batch's level spread is not collapsed to 1 or 2 values |
| P6 | verb share of the batch's level 1-2 rows is in range |
| P7 | held rate and `native_check` rate recorded |
| P8 | cost and output tokens per row recorded, extrapolated to 2,728 |

A P8 extrapolation Marwan is not willing to pay stops the run before the loop, not after.

---

## 9. Tests

Offline, no network, `node:test` against fixtures.

- `sample.mjs`: same seed gives the same plan; every id appears exactly once.
- `validate.mjs`: rejects missing `level`, bad enums, id mismatch, extra rows.
- `route.mjs`: any pair claim holds; any M or L holds; `native_check` holds; all-H with no pair goes auto.
- `rulefix.mjs`: known character substitutions and tag conversions, on a fixture of real rows.

---

## 10. Decided at pilot, not now

- **Field-level routing.** If the held rate from P7 makes manual review too large, 7.2 splits so confident fields promote independently. The threshold is Marwan's call with the number in front of him.
- **Batch size.** Per 7.4, from the P8 measurement.

---

## 11. Out of scope

- Promotion. Runbook §4, run by hand.
- The adjudication worksheet. Separate tool, after the pass.
- The `claude` edge function deployment. Open §J item, blocks the full loop, not the pilot.
- Anything touching `dictionary`.
