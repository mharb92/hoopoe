# Hoopoe handover — chat 20

For a fresh chat on **§E Architecture**. Read with project knowledge (`PROJECT_SPEC.md`, `principles.md`, `spec-tracker.md`) and the connected repo. Replaces `handover-chat19.md`, delete that one.

## Constraints

- **Browser only.** The work laptop blocks the Supabase CLI's management API and wraps Homebrew in an Artifactory shim. Anything needing a terminal runs in a Claude Code cloud session. Never propose a local CLI step.
- **Marwan is not a developer.** Exact clicks, exact text to paste, what success looks like at each step.
- **One build ref.** `mharb92/hoopoe` @ `main`. `mharb92/arabic-app` @ `modular-rebuild-5` @ `7dc0b14` is read-only harvest, cite for findings only. HTML monolith retired. No other ref is ever cited.
- **Deliverables are complete files**, never diffs or edit instructions. Handover and state docs: `.md` only. Prompt before changing skill, spec or tracker.
- **Numbering.** §D sub-sections are `D.1` to `D.15`, with the dot. Bare `D###` is always a decision-log id.
- **Realisations go to chat, not files.** State a gap in one line and stop; nothing is written until Marwan decides.

## State

**§A through §D approved.** `PROJECT_SPEC.md` is unchanged by chat 19 — D210 is DR content work, not a spec section.

Chat 19 settled one decision, D210, and opened §E without drafting it.

## §E: agreed and not agreed

**Agreed as direction, no D number yet.** Stack option C: TypeScript with a build step, produced in a cloud session with the built output committed beside source, plus a CI **build-freshness gate** that rebuilds from source and fails the PR if the output differs. The reasoning is D197's, already applied to fonts and mascot exports: a step that only runs in CI cannot be debugged from a browser. The freshness gate exists because C's failure mode is source and served bytes drifting apart silently.

It gets a D number when §E.1 is drafted with the view layer and module boundaries beside it. Do not treat it as settled spec, and do not relitigate it either.

**Not decided:** view layer (vanilla plus render helpers / Preact / Lit), module boundaries, and everything in blocks 2 and 3.

**Block shape, approved chat 19:**

1. **Stack and structure.** Language, framework, build step, type discipline, repo layout and module boundaries, where code runs given browser-only.
2. **Runtime shape.** App shell, routing, state ownership; the Supabase access seam; offline queue and sync (D180); config resolver (D170, C10.6-C10.7); client seams to the AI gateway (C5.7) and audio assets (C9.5).
3. **Build-time and portability.** Content and asset pipelines (C5.5 validators, C9.4 corpus, D194 subsetting); the three gates §D assumed (token lint D143, contrast CI D189, font render test D194); native-app portability (B6, D11).

Then the internal review pass, then the principles check.

**Boundary calls made:**

1. §E owns access mechanism; §F owns every record shape. §E names a table only where the mechanism cannot be described without one.
2. §E defines the build gates and what fails them as a contract §H consumes. §H owns when they run in the release flow, plus smoke tests and triage. This is the seam most likely to fail on review rather than on drafting.
3. Auth, invite, gateway credentials and RLS are §G. §E defines only the client-side seam and what it assumes is true.

**Owed to §E by §D (D.14):** the offline queue and sync mechanism (D180), the config resolver (D170), native-app portability (B6), and the three build gates. Q1 also lands here; the repo half was closed by D136.

**Run the §D-style internal review before §E's principles check.** In §D three decisions passed on drafting and failed on review, and three screens were absent entirely. The gate is whether the thing can be built from the text without a second judgement call.

## DR, running in parallel

Never blocks §E-§J (D141).

- **B1 merged to `main`**, 41 `node:test` cases pass. **B2 is next and runs in a `hoopoe-dr` cloud session, not in chat.** B3 and B4 not started, none blocked.
- **D210 (chat 19) unblocks B4.** Vowel length is a per-row judgement inside the produced `romanization` value: decided from the word, never carried over from the existing string, never rule-fixed, never a `corrections` entry. `rulefix.mjs` may not map `oo`/`uu`/`ee`/`ii` onto each other. New pilot check **P10**, the vowel-length flip rate, catches the model passing the conflated source through: a rate near zero means the instruction did not take, so fix the prompt and re-run the pilot before the loop. The native spot check now samples at least 20 long-vowel rows of the 40.
- **Why it is not a correction:** a flagged romanization correction caps `review_confidence` at 2, most rows carry a long vowel, and MVP content selection filters on 3. Routing it through corrections would have emptied the pool.
- **What D210 does not buy:** verification. Arabic script does not disambiguate vowel length either — و carries both `oo` and `uu`, ي both `ee` and `ii` — so `arabic_vocalised` cannot cross-check the romanization and no deterministic rule can be written. Correctness rests on the model's lexical knowledge plus the spot check. Recorded as an extension of **R7**, not a new risk id.
- **Tier 0 applied and verified.** `review_confidence` and `native_verified` on `dictionary`, `service_role` granted, verification returned 2,728 / 0 / 0 / 2,728. All six named gates unchanged.
- Batch size 60 was set ahead of measurement, not by it. P8 still decides.

## Manual actions for Marwan

- Replace `docs/dr/dr-prompt-scoped.md` and `docs/dr/dr-scoped-pass.md` in `hoopoe` @ `main` with the versions delivered in this chat. PR in the browser.
- Replace `spec-tracker.md` and `principles.md` in project knowledge. Delete `handover-chat19.md`, add this file.
- Install the updated `arabic-learning-app` skill delivered in this chat.
- Start B2 in a cloud session. D210 changes two `.md` files and one `rulefix.mjs` fixture assertion, not module code, so B2 is unaffected.
- Correct the `docs/dr/romanization-map.md` header: it cites D142 where D141 is meant. D142 is the dark-theme decision.
- Still outstanding after seven handovers: rotate the ElevenLabs key in `arabic-app` git history. Ten minutes at the provider.
