# Generation test plan (rework R5, D391)

Reference, not state. `docs/spec-tracker.md` wins. Specified chat 38; not run. It fills the placeholders in spec §C5: call shape (C5.4), model and effort per surface (C5.8), cost (C5.9), partner caps (C5.7) and latency.

## 1. Questions it answers
1. How often does a call go bad (fails validation on the first try, or fails outright), and why?
2. Whole set in one call, or one call per lesson in parallel (C5.4)?
3. Opus 5.5 at medium effort, Opus 5.5 at low effort, or Sonnet 5.5, per surface (C5.8)?
4. Cost per set, per block plan, per live turn, and projected per learner per month at each learner's pace (C5.9, D293).
5. Wait time per call: block plan (plan reveal, C3.12), set (the post-quiz review, C4.17), live turn.
6. Cost per partner turn, which sets the partner's caps (C5.7, D366).
7. Whether a beginner story at about 100 known words passes the 95% rule (C4.14, D392).

## 2. Learners
Three learners from the real "about you" forms, filled in by Aya, Marwan and Omar themselves (C3.3). Placement results are synthetic: Aya at the bottom; Marwan and Omar heritage profiles with stage A-B grammar seeded at half credit. One extra beginner state at about 100 known words and phrases checks the story gate.

## 3. Prerequisites (stubs built for the test, kept as R7 drafts)
- A grammar-path and milestone slice: stages A-B with their can-do names.
- About 20 verb tables, built by code and cross-checked against a model; disagreements to a CSV. These also go into the expert package (D315).
- A short fictional name list for the cast (D342).
- The check code for C5.5 and the critic prompt (C5.6).
- The lesson templates as declared in C4.1.

The test tool is built before the Phase 2 build package is approved, on the DR tools' precedent (Omar, chat 38). It lives in `tools/gen-test/` and runs with `node:test` cases.

## 4. Runs
| Arm | Writer | Critic | Call shape |
|---|---|---|---|
| A | Opus 5.5, medium | Opus 5.5 | whole set **and** per lesson |
| B | Opus 5.5, low | Opus 5.5 | per lesson |
| C | Sonnet 5.5 | Opus 5.5 | per lesson |

The critic is held fixed so the writers are compared fairly; production uses a different model from the writer (C5.6). Both call shapes get identical inputs (C5.3); only the call size differs.

Per learner and arm:
- one block plan;
- set 1, then set 2, which is fed a simulated weekly quiz result so the carry-forward check and the intake step (C3.7) are exercised;
- heritage learners: one live conversation lesson (8-12 turns) with its evaluation.

Per arm: about 3 partner sessions of 12-15 turns, with a cheap model playing the learner.

## 5. Measures
- First-try validation failures per lesson and per set, by validator and failure class.
- Calls that fail outright: broken output, cut off, timed out.
- Critic flags; attempts per lesson to pass; final failures that fell back to a review lesson.
- Tokens in, out and cached; cost; wait time, per call.
- Projected monthly cost per learner at that learner's pace.
- **Blind read:** about 40 shuffled sentences per arm, model hidden, each marked right, wrong or unnatural with a note. A reader chosen by Omar and Marwan.

## 6. Decision rules, fixed before the run (placeholders)
- **Call shape:** whole set if under about 10% of lessons fail validation on the first try and a set is ready within about 5-10 minutes; otherwise per lesson.
- **Model per surface:** Sonnet replaces Opus if its first-try pass rate is within 10 points, the blind read finds at most 1 extra error per 100 sentences, and it costs at most 60%.
- **Story gate:** the 100-word placeholder stands if the beginner story passes the 95% check within 3 attempts; otherwise it is raised.

## 7. Budget and transport
- **Ceiling $40** (Omar, chat 38). Estimate about $34-36: sets and block plans across the arms about $22, conversation lessons about $2.50, partner sessions about $4, verb tables about $1, prompt shake-out about $4-6. If shake-out threatens the ceiling, the run stops and reports before spending more.
- Runs on the `judge-cli` transport, against the Claude Code account's credit, with `DR_ANTHROPIC_KEY` removed from the environment (D260). That transport adds its own overhead, so production costs are projected from token counts at published API prices.
- Prices used for planning (per million tokens, cached at chat 38): Opus 5.5 $4 in / $20 out / $0.20 cached read; Sonnet 5.5 $2 / $10 / $0.20. These matched the DR finalize run's measured spend.

## 8. Outputs
- `runs/gen-test-<date>/`: inputs, outputs, check results, costs, a report.
- Tracker rows setting C5.4's call shape, C5.8's models, C5.9's estimate and C5.7's partner caps.
- **For the expert package (D315):** the winning arm's passing first-block sentences for all three learners, about 90-180, plus the verb tables. Caveat: the expert validates what that prompt version produces; a later prompt change is unvalidated until re-checked.
- The three test learners can be kept as a standing check for later prompt changes; that is a separate decision, not taken.
