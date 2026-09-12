# Hoopoe: session rules

Palestinian Arabic learning PWA, clean rebuild, spec phase. Read this before proposing or writing anything.

## Status

Spec in progress. Sections A, B, C1-C11 approved; D-J todo. **No app code until the Phase 2 build package is approved.** The only sanctioned work in this repo right now is the DR batch harness under `tools/dr/`.

## Repos

| repo | ref | status |
|---|---|---|
| `mharb92/hoopoe` | `main` | rebuild base. Everything new goes here |
| `mharb92/arabic-app` | `modular-rebuild-5` @ `7dc0b14` | read-only harvest source. Cite for findings. Never patch, never build on, never copy forward |

Never cite any other branch or repo. Raw reads of harvest material: `https://raw.githubusercontent.com/mharb92/arabic-app/modular-rebuild-5/{path}`.

## Retired, never cite or build on

- The HTML monolith.
- Legacy engine (`lesson.js`, `quiz.js`, static units) and Aya's course (spec B7).
- Onboarding dialect picker, guest mode.
- `rank` as a difficulty signal. Retired chat 3, it is generation batch order.

## Rules

- State and handover docs: `.md` only.
- Plan and debate first. Explicit approval before any deliverable.
- Deliver complete updated files, never diffs, find/replace blocks or edit instructions. Scope edits to the affected sections, but hand back the whole file.
- Compressed writing. Optimise tokens. Read docs by section (`grep -n "^#"` then `sed -n`), never load whole files.
- Prompt Marwan when a skill, spec or tracker change is needed. Do not make one silently.

## Sources of truth

In the claude.ai project, not in this repo: `PROJECT_SPEC.md` (approved sections are binding), `principles.md` (18 principles, recorded risks, section gate), `spec-tracker.md` (agenda, decision log, open questions). A cloud session cannot see them. If a task needs them, they get pasted in or committed deliberately.

In this repo: `docs/dr/dr-spec.md`, `dr-prompt.md`, `dr-runbook.md`. These 3 are frozen. Do not re-derive the prompt or the rubric from memory; read the files.

## DR (dictionary review)

Batch pass over 2,728 `dictionary` rows: `level` 1-5, `arabic_vocalised`, `register` + `form_origin`, `pos` enum, romanization normalisation, `track_id` backfill, `formula_pair`, `function_words`.

Non-negotiable:

1. The live `dictionary` is never written to during the pass. Everything lands in `dictionary_review` staging.
2. The linguistic judgement model is Opus, set inside the runner's API call, independent of whichever model orchestrates the session.
3. Run as a loop script, not turn by turn. State lives in the staging table, keyed on `(run_id, dictionary_id)`, so a killed or restarted session resumes at the first row with no entry.
4. Promotion is one reviewed SQL step behind gates G1-G8. In-place row edits only, ids never change, no delete and re-import.
5. Every `pair` claim is held for human review regardless of model confidence.

Run order, gates and promotion SQL: `docs/dr/dr-runbook.md`.

## Supabase

Project ref `xkhulybdrxdzakarivvi`, URL `https://xkhulybdrxdzakarivvi.supabase.co`. RLS is currently off on all tables, which is a known open item, not a licence to rely on the anon key for writes.

Row counts without pulling data: `Prefer: count=exact` + `Range: 0-0` + `-I`.

## Cloud session requirements

The Default cloud environment cannot reach Supabase. A session doing DR work needs an environment with:

- **Custom** network access including `*.supabase.co`, with the default package-registry list kept.
- The Supabase `service_role` key stored as an **API credential** scoped to the Supabase host, so the session never sees it. Not as an environment variable.
- The Anthropic key for the Opus batch calls as an environment variable, or the calls routed through the existing `claude` edge function. The agent proxy never attaches a stored credential to `api.anthropic.com`.

`api.anthropic.com` and GitHub are reachable by default.
