# Hoopoe (الهدهد)
Palestinian Arabic learning PWA. This file is the entry point for every session in this repo. Read it before proposing any design, data model, code or build step.

## Status
Rebuild spec in progress. No build until the Phase 2 build package is approved. **§A-§D approved (chat 18); §E Architecture open (chat 19): block shape approved, stack direction settled, nothing drafted.** DR build B1 merged to `main`; B2-B4 not started, none blocked since D210. Current section: see the `docs/spec-tracker.md` agenda.

## Sources of truth, in priority order
1. `docs/PROJECT_SPEC.md`: approved sections are binding. Do not infer beyond them.
2. `docs/principles.md`: the 18 learning principles every section is checked against, recorded risks, and the section gate. Binding on proposals.
3. `docs/spec-tracker.md`: session rules, agenda, decision log, bug history, refactor history, open questions, parked items. **This is the state file. Nothing else holds session state.**
4. `docs/harvest.md`, `docs/harvest-prompts.md`, `docs/schema-snapshot.md`: findings from old code on `arabic-app` @ `modular-rebuild-5` @ `7dc0b14`. Reference only, never binding.

DR docs live at `docs/dr/`. Read them from the repo, never re-derive a prompt, rubric or romanization rule. **`docs/dr/romanization-map.md` is the single source of truth for the D47 Arabizi standard** and supersedes the 10-symbol sketch in C4.7: one glottal `2` for hamza and urban ق, ض `9'`, ظ `6'`, apostrophe as emphatic modifier only, five long vowels never collapsed, taa marbuta by environment, `il-` hyphenated and assimilating, digraph breaker `-`, allowed set `a-z` `2 3 6 7 9` `'` `-`, lowercase only. `prompt.mjs` injects it verbatim; the `romanization_map` table seeds from it at the freeze. Its header cites D142 where D141 is meant — a known error, queued for §J. **The pass is scoped (D141): `dr-scoped-pass.md` and `dr-prompt-scoped.md` are what runs.** One unattended machine pass collects `level`, romanization, `arabic_vocalised`, `pos`, `register`, `form_origin`, flagged `corrections` and `native_check`. Every human queue is deferred to a named gate: `pair` and `constituents` to a second pass, corrections triage and held-row adjudication to a worksheet, the 40-row native spot check to a point in front of the family test, F1-F7 and the D131 gap cross-check to after the second pass. Vowel length is judged inside the produced `romanization` value, never rule-fixed and never a `corrections` entry (D210). `dictionary.review_confidence` 1-3 and `native_verified` decide MVP content selection, which filters `review_confidence = 3`; the legacy `confidence` column is retired as a selection signal. `dr-spec.md` (rubric, enums, acceptance floors) and `dr-runbook.md` (run order, gates G1-G8, promotion SQL) are reference and predate the scoping, so where they disagree with the scoped pass, the scoped pass wins; `dr-prompt.md` is superseded outright. `dr-runner-spec.md` owns the batch runner: module map, model seam, batch plan and resume, pilot gate P1-P9, and the 7 resolutions where the frozen docs could not be executed as written (D140). It never restates their contents; where it and the frozen docs disagree, its §7 is the reason. The runbook's schema step omits chat 14's grants, so `supabase/migrations/20260912135736_dr_schema.sql` is the schema record, not the runbook.

Read by section: `grep -n "^#"` first, then `sed -n` the ranges needed. Never load whole files.

## Repos (D136)
| repo | ref | status |
|---|---|---|
| `mharb92/hoopoe` | `main` | rebuild base. Everything new lands here |
| `mharb92/arabic-app` | `modular-rebuild-5` @ `7dc0b14` | provenance only. Harvest findings are in `docs/`; never fetch, patch or build on it |

No other repo or branch is ever cited. `arabic-app` is archived read-only after DR promotion. Cloud sessions develop on their own branch; Marwan merges by PR in the browser and deletes the branch.

## Supabase projects (D137)
| project | ref | role |
|---|---|---|
| `hoopoe`, new | `pniwgnjljpkiimssortp` | build target. Free org, West EU (Ireland). Created with expose-new-tables off, auto-RLS on. All writes land here |
| old | `xkhulybdrxdzakarivvi` | read-only, anon key. Stays live until DR promotes, then pauses |

Only `dictionary` migrated (chat 14, D139): 2,728 rows, ids preserved exactly, never renumbered, `id||arabic` sha256 verified on both sides, sequence resynced. The 4 profiles and 20 `personal_vocab` rows are dropped; `personal_vocab` is re-imported after §F defines its shape. Supabase's GitHub integration stays disconnected: it deploys schema on push and cloud sessions push to `hoopoe`. Schema is applied by hand in the browser SQL Editor, then recorded in `supabase/migrations/` as a full replayable recipe: base table, DR columns, DR tables, RLS and grants, all idempotent. Never propose a migration file that only captures the delta. `conjugation` is `text`, not jsonb.

Row counts: `Prefer: count=exact` + `Range: 0-0` + `-I`. Old project `xkhulybdrxdzakarivvi` is read-only always. DR writes go to the new project only: `dictionary_review` staging during the pass; `dictionary` written once, at promotion, behind gates G1-G8.

## Session rules
- State: `.md` only, in this repo. `docs/spec-tracker.md` is the state file.
- Skills, spec and tracker: prompt Marwan when a change is needed; change only the affected sections, but always deliver the complete updated file with the changes already applied. Never hand over diffs, find/replace blocks or edit instructions.
- Compressed writing; optimise tokens. Pull files by section (`grep -n "^#"`, then `sed -n`), never whole.
- §D sub-sections are numbered `D.1` to `D.15`, with the dot. A bare `D###` always means a decision-log id.
- Plan and debate first; explicit approval before any deliverable.
- **Realisations go to chat, not to files.** When a gap, conflict or unowned item surfaces mid-work, state it in one line and stop. Nothing enters the spec, tracker or a skill until Marwan decides to resolve or park it. Logging a question in the tracker's open questions is allowed once he has said to park it. Never write a provisional answer and revise it after the decision: that round trip is the single most expensive thing we do.
- **Be extremely concise.** Plain, direct English, shortest form that carries the point. No preamble, no restating the question, no summarising what was just delivered. State conclusions first; give reasoning only where the conclusion is contestable, and then in one line. Marwan asks when he wants elaboration. This governs length and phrasing only: disagreements, risks, errors and contradictions are still raised in full, just stated briefly.
- **Browser-only.** The work laptop blocks the Supabase CLI's management API and wraps Homebrew in an Artifactory shim. Every terminal step runs in this session, never on Marwan's machine. Never propose a local CLI step. Marwan is not a developer: give exact clicks, exact text to paste, and what a successful result looks like.
- Brand is data, not code (D138): one `BRAND` config object, neutral storage and cache key prefixes, no brand string in table or column names. The name is unsettled.

## Principles gate
Every spec section from C6 on, and the Phase 2 build package, ends with a principles check against `docs/principles.md` (discharges / defers / at risk). A section that puts a principle at risk without a mitigation or a recorded risk id is not approvable.

## Retired (never cite, patch or build on)
- HTML monolith.
- Legacy engine (`lesson.js`, `quiz.js`, static units) and Aya's course (spec B7).
- Onboarding dialect picker, guest mode.
- Patching `arabic-app` @ `modular-rebuild-5`. It is harvest material, not the rebuild base.
- claude.ai project knowledge as a location for anything. `docs/` is where project docs live.
- Handover docs. Superseded by `docs/spec-tracker.md`; the last one is kept at `docs/archive/` for history only.
- The Opus-in-chat / Sonnet-in-Code tooling split. Opus runs here.
- The `arabic-learning-app` stub skill. This file replaces it.
- Old master-reference content of that skill (file manifest, routing, bug lists, backlog). Superseded by harvest and spec.

## Cloud environment (DR and any Supabase work)
The Default environment reaches GitHub, `api.anthropic.com` and package registries only, so Supabase calls fail. The `hoopoe-dr` environment needs:
- Network access **Custom**: `pniwgnjljpkiimssortp.supabase.co` and `xkhulybdrxdzakarivvi.supabase.co`, both, because the migration reads one and writes the other. Keep the default package-manager list.
- New project's `service_role` as a stored **API credential** scoped to `pniwgnjljpkiimssortp.supabase.co`, so the session never sees the key. Pro and Max only; added by editing an existing environment, not at creation.
- **Credential shape: two custom headers on one entry.** Supabase's gateway requires an `apikey` header on every `/rest/v1/` call, separately from `Authorization`, and no credential *type* in the dropdown supplies it. Set `Authorization` with prefix `Bearer`, and `apikey` with the prefix field **empty**, both holding the same key. Expand the resolved curl example and confirm two `-H` flags with the same value before saving. Existing credentials cannot be edited, so any fix means creating a replacement and deleting the old one. The same shape applies to the new `sb_secret_` keys.
- Old project needs no credential: RLS is off there and its anon key is public in `arabic-app`'s `js/config.js`.
- Anthropic key as an env var (readable by anyone using the environment) or, preferred, batch calls routed through the existing `claude` edge function.
- **Reading a failure.** 401 `UNAUTHORIZED_MISSING_API_KEY` with `X-Proxy-Error: upstream auth failed` means the `apikey` header is absent: a credential problem, not a Supabase setting. 403 with `42501 permission denied` means grants: tables created by hand in a new project do not inherit `service_role` privileges. Fix in the SQL Editor with `grant all on table ... to service_role;` and `grant usage, select on all sequences in schema public to service_role;`, then confirm with `select has_table_privilege('service_role','public.dictionary','INSERT');`. Any table the batch runner creates later needs the same grant.
- **Migration pattern that worked (chat 14).** Snapshot the source to a committed JSON file first, hash it, then insert from that file rather than re-pulling live, so the gate hash covers exactly the bytes written. Batches of 200 with `on_conflict=id` for idempotent retries, `Prefer: return=minimal`, stop on the first non-2xx and report rather than patching.
- Long jobs run as a loop script with state on disk or in the database, never turn by turn: sessions restart.

## Skills in this repo
At `.claude/skills/`, triggered automatically by their own descriptions:
`specification-first`, `scope-and-extensibility`, `build-protocol`, `modular-architecture`, `data-migrations`, `test-driven-development`, `code-validation`, `mobile-ux`, `skill-evolution`.

They are universal and say nothing about Hoopoe. Hoopoe-specific overrides belong in this file or in `docs/spec-tracker.md`, never inside a skill. Skills are per-repo copies: changing one here does not change it anywhere else. See `skill-evolution` for how a change gets made.
