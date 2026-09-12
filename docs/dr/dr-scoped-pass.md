# DR scoped pass (D141)

Status: approved chat 16. Scopes the single machine pass that runs before the MVP.

Sits beside the frozen docs and amends none of them. `dr-spec.md`, `dr-prompt.md` and `dr-runbook.md` keep describing the full review; this file says which part of it runs now, which part is deferred, and behind which gate the rest returns. `dr-runner-spec.md` still owns the machine; §6 below lists the deltas the scope forces on it.

Reason for scoping: DR has consumed four chats and the MVP is blocked on §D-§J, not on the dictionary. The machine pass is unattended and cheap. Every human queue behind it is expensive. So the pass collects everything the model can emit while it is already reading the row, and defers every queue.

---

## 1. Collected now

Judged per row, one pass, unattended:

| # | field | why it cannot wait |
|---|---|---|
| 1 | `level` 1-5 + reason + conf | placement bands, ceiling+1 item sets, quiz gating. Nothing in the core loop works without it |
| 2 | `arabic_vocalised` | TTS input and the harakaat display source. Unvocalised Arabic gets MSA vowels |
| 3 | `romanization` | D47 Arabizi standard, every row |
| 4 | `pos` enum | distractor selection matches on it |
| 5 | `register` | C2.2 filters on it |
| 6 | `form_origin` | free alongside `register`, and re-collecting means a second full pass |
| 7 | `corrections`, flagged only | a wrong gloss propagates into every lesson built on the row. Flags are collected and never applied by this pass |
| 8 | `native_check` | the model's own request for human eyes |

---

## 2. Deferred, and behind what

| deferred | kind of later | gate |
|---|---|---|
| `corrections` triage | collected, triaged later | a worksheet against staged rows, any time |
| held `level` / romanization / vocalised | collected, adjudicated later | same worksheet |
| `pair` (`formula_pair` table) | not collected, needs a second pass over ~272 rows | before any release beyond the family test |
| `constituents` on formula and frame rows | not collected, same second pass | same |
| native spot check | human step | **in front of the family test**, not behind it. 40 rows sampled from `review_confidence = 3` |
| F1-F7 acceptance floors | human decision step | after the second pass, when the pool is whole |
| third-party gap cross-check (D131) | human step | with F1-F7 |

Deferred items are attached to a gate, not to a list. The §J bullet list already carries an unrotated credential through four handovers; that is the failure mode this table exists to avoid.

---

## 3. `review_confidence` 1-3

New column on `dictionary`, written at promotion. Distinct from the legacy `confidence` column, which is generation-time and near-useless as signal (2,422 of 2,728 rows are a 5). The legacy column is not a selection signal anywhere after this pass.

**Critical fields:** `level`, `romanization`, `arabic_vocalised`, and the enum triple (`pos`, `register`, `form_origin`) which carries one shared `enum_conf`.

| score | rule |
|---|---|
| **3** | every critical field `H`, `native_check` false, and no `corrections` entry of type `meaning`, `harakaat` or `romanization` |
| **2** | no critical field `L`, and any of: a critical field `M`, `native_check` true, a flagged correction on meaning, harakaat or romanization |
| **1** | any critical field `L`, or a required field missing or not a valid enum value |

Row score is the **minimum** across critical fields: a row is only as usable as its weakest one. Non-critical detail never drags it down.

A flagged correction caps a row at 2 even when the model is confident about the fix, because this pass does not apply corrections. A row whose gloss is known-suspect and unfixed is not safe to teach from. That is what makes collecting the flags worth doing even with triage deferred.

**`native_verified`** is a separate boolean, default false. "The model was confident" and "a native speaker read it" are different claims; collapsing them into a 4th score value loses the distinction exactly where it matters.

---

## 4. What MVP content selection uses

`review_confidence = 3`. Rows at 1 or 2 are invisible to the bank build, item sets, distractors and the generation pool until re-review upgrades them **in place**. Upgrading widens the pool without republishing anything already built, which is the whole point of putting the score on `dictionary` rather than leaving it in staging.

Consumers amended: C2.2 source filter, C5.5 dictionary selection floor.

---

## 5. What this does not give you

Consistency, not verified accuracy. Every row is judged against one rubric, which is more than the dictionary has today. Nothing is verified until a native speaker reads it, and `dr-prompt.md` carries a standing calibration warning that the model is stronger on MSA than on dialect and will confidently push good Palestinian toward MSA. A confidently wrong row scores 3 and ships.

This is why the 40-row spot check samples **from the 3s specifically**: that is the population that reaches learners. Clean 3s mean the filter can be trusted and the rest deferred indefinitely. Dirty 3s are worth discovering at 40 rows rather than at 2,728.

Recorded risk: R7 in `principles.md`.

---

## 6. Deltas to `dr-runner-spec.md`

The runner is unchanged except where the scope removes work:

- **Prompt source** is `dr-prompt-scoped.md`, not `dr-prompt.md`. Fields 8 and 9 are dropped from the contract; `enum_conf` is added.
- **No grouped batches.** The 272-row social-formula batch and the closed sets existed for pair and gap detection. With both deferred, sampling is a single seeded stratified shuffle over all 2,728 ids. §7.3 sliding slices are not needed and `sample.mjs` loses that path.
- **Routing** drops the "any pair claim holds" rule (no pair claims are collected) and gains the §3 score. `route.mjs` writes `payload.routing` per field as before, plus `payload.review_confidence`.
- **Pilot gate** keeps P1-P8 and gains **P9: the `review_confidence` distribution over the batch, extrapolated to 2,728.** P9 is the number that decides whether the MVP pool is large enough. P7's held rate is now a secondary reading.
- **Default batch size** starts at 60, not 120. Dropping two fields saves less output than romanization and `arabic_vocalised` cost. P8 still decides.
- Promotion is unchanged: still a hand-run SQL step behind G1-G8, still nothing in the runner writes `dictionary`.

---

## 7. Second pass

Not scheduled here. It collects `pair` and `constituents` over the formula and frame rows, applies the triaged corrections, and runs F1-F7 over the whole pool. It shifts levels on rows already taught, so it lands at a phase boundary under the C10.7 frozen-key rule, not mid-test.
