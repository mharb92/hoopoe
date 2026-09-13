# DR runner build brief

For Claude Code cloud sessions on the `hoopoe-dr` environment. Chat owns the plan; the session owns the code. Read `dr-runner-spec.md` first, then `dr-scoped-pass.md` §6 for the deltas this scope forces.

## Standing rules for every session

- Branch per batch off `main`. Never push to `main`; Marwan merges by PR in the browser.
- Node ESM, zero runtime dependencies. Built-in `fetch`, `node:test`, `node:crypto`.
- Each module under ~150 lines, one job.
- **No code path writes `dictionary`.** Promotion is a hand-run SQL step. If a task seems to need a dictionary write, stop and report instead.
- Stop and report on any non-2xx from Supabase, two consecutive batch failures, or the spend cap. Never continue past a failure and never edit model output to make the schema pass.
- Report back at the end of the batch with what passed, what did not, and anything in the spec that could not be executed as written. Do not start the next batch.

---

## B1 — offline core

No network in any module.

`config.mjs`, `sample.mjs`, `rulefix.mjs`, `prompt.mjs`, `validate.mjs`, `route.mjs`, plus `node:test` suites for the last four.

- `sample.mjs`: single seeded stratified shuffle over all 2,728 ids, chunked. No grouped-batch path.
- `prompt.mjs`: builds the batch message from `dr-prompt-scoped.md`, filling `<<ENUMS>>`, `<<LEVEL_RUBRIC>>`, `<<ROMANIZATION>>` from `dr-spec.md` §2-§4.
- `validate.mjs`: the scoped contract, including `enum_conf`.
- `route.mjs`: status plus the `review_confidence` derivation in `dr-scoped-pass.md` §3. No pair rule.

**Done when:** all four suites pass; the same seed produces an identical plan twice; every id appears exactly once across the plan.

## B2 — edges

`db.mjs` and `judge.mjs`.

- `db.mjs`: PostgREST read of `dictionary`, upsert of `dictionary_review` on `(run_id, dictionary_id)`. Credential shape is `Authorization: Bearer <key>` plus `apikey: <key>`, same value.
- `judge.mjs`: the seam, `judge(rows, cfg)`. Transport config `anthropic-direct` for the pilot, `edge-function` stubbed for later. Judging model named in the API call.

**Environment preconditions.** The read and upsert halves need only the Supabase credential the `hoopoe-dr` environment already carries. The live call needs two things that environment does not have yet: `api.anthropic.com` added to its **Custom** network list, and an Anthropic key as an environment variable (acceptable for the pilot only; the `claude` edge function route is required before the full loop). If either is missing, build both modules, satisfy the dry-run half, and stop and report rather than working around it.

**Done when:** a dry run reads all 2,728 rows and stages nothing; one live single-row call returns output that `validate.mjs` accepts.

## B3 — orchestrator

`run.mjs` and `report.mjs`.

- Resume on `(run_id, dictionary_id)`: a killed run restarts at the first row with no staging entry.
- Cost metering per batch, spend cap, stop conditions.
- `report.mjs`: P1-P10 (`dr-runner-spec.md` §8 for P1-P8, plus P9, the `review_confidence` distribution extrapolated to 2,728, and P10, the vowel-length flip rate — both defined in `dr-scoped-pass.md` §6).

**Done when:** the full pipeline runs end to end against a stubbed model and stages one fake batch; `grep -rn "dictionary" tools/dr` shows no write path to that table; `runs/<run_id>/` holds the manifest and report.

## B4 — pilot

Not code. One real batch of 60 rows, then stop. Report P1-P10 to chat.

Two decisions wait on the numbers: the `review_confidence` distribution (P9) decides whether the MVP pool is large enough, and output tokens per row (P8) decides batch size for the loop. A P8 extrapolation Marwan is not willing to pay stops the run before the loop, not after.

P10 (D210) is a pass/fail on the prompt, not a number to weigh: a vowel-length flip rate at or near zero means the model carried the conflated source value through, so the prompt is fixed and the pilot re-run before the loop.

---

## Opening prompt for B1

```
Read docs/dr/dr-runner-spec.md, then docs/dr/dr-scoped-pass.md, then
docs/dr/dr-build-brief.md. Build B1 only.

Branch: dr-runner-b1. Do not push to main.

Stop and report if anything in the specs cannot be executed as written, or if a
task appears to require writing to the dictionary table. Do not start B2.
```
