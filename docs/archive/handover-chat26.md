# Chat 26 handover — DR scoped pass, romanization revision, essentials

Reference only. **State stays in `docs/spec-tracker.md`**; this file exists so a parallel session can align without replaying the transcript. Decisions D260-D268 are in the tracker's decision log; where this file and the tracker disagree, the tracker wins.

Branch: `claude/serene-goldberg-0fomh0`, 16 commits ahead of `main`, tree clean, 150 `node:test` cases pass. **Not merged.** `dictionary` untouched: 0 of 2,728 rows carry `level` or `review_confidence`.

## 1. What changed, in order

### D260 — the transport was wrong, and the premise under D247 was wrong
The ~$40 promotional balance is on the **Claude Code account, not the Anthropic API console**. `DR_ANTHROPIC_KEY` bills a card, so every model call on the API path spent real money while the credits sat unused. Fix: a third transport, `judge-cli` (`tools/dr/judge-cli.mjs`), behind the existing `judge(rows, cfg)` seam — the `claude` CLI, already present in a cloud session, no key and no network allowlist entry needed.

Every DR job now runs as:

    env -u DR_ANTHROPIC_KEY bash tools/dr/full-loop.sh <run-id>

`full-loop.sh` refuses to start while the key is present (exit 6), and asserts per chunk that the manifest transport is `judge-cli` and that P8 metering came from the CLI envelope rather than D243's price table. D247's $36 cumulative ceiling is unchanged and is never raised; on this transport the figure caps a **list-price equivalent of allowance**, not a card charge.

Two hardening choices beyond the brief:
- `--system-prompt` **replaces** the CLI's preset rather than appending, removing the version drift chat 25 flagged.
- the child runs in an **empty cwd with repo env vars stripped**, so no `CLAUDE.md` or skill reaches the judging model.

`readEnvelope` fails closed on: CLI-reported failure, missing `total_cost_usd`/`session_id` (positive proof it came back through Claude Code), a model pin that did not hold, empty result.

### D262 — the romanization scheme was revised
`docs/dr/romanization-map.md` is rewritten and is the single source of truth. The 10-symbol sketch in §C4.7 and the old map are both superseded.

| | |
|---|---|
| ص `S` · ض `D` · ط `T` · ظ `TH` | the four emphatics, the only capitals in the scheme |
| `'` | the glottal stop, and nothing else |
| `q` | ق realised as [q] — the MSA-borrowed, religious and proper-noun stratum |
| retired | `2`, `6`, `9`. The digit set is now `3` and `7` only |

Word-initial rule: a hamza-carrying alif (أ إ آ ا) is a **vowel seat** and takes no glottal — `awlaad`, `ana`, `imbaari7`. A word-initial ق realised as [ʔ] **is** written: `'ahwe`.

**ق is a per-row judgement, not a substitution.** `qur'aan` is urban Palestinian and is not a rural variant; `'ur'aan` was in the shipped data and is wrong.

The staged rows from `dr-full-2026-09-13` are superseded by this. `rulefix.mjs` migrates deterministically (`9'`→`D`, `6'`→`TH`, `9`→`S`, `6`→`T`, `2`→`'`, plus the word-initial drop) and **never invents a `q`** — only re-judging produces `qur'aan`.

### D263 — typed romanization grades on phonetic equivalence, not Levenshtein
Amends C4.6. **`PROJECT_SPEC.md` §C4.6 prose still says Levenshtein and has not been amended** — open work. Equivalence classes are in the map's new §5: long-vowel quality forgiven (`oo`≡`uu`, `ee`≡`ii`), emphasis forgiven (`S`≡`s` etc.), **vowel length graded** (`katab` ≠ `kaatab`), `'`≡`q` **not** forgiven.

### D264 / D268 — the character-set validator is implemented at last
The map had claimed "the validator rejects anything else" since D47; nothing enforced it. `tools/dr/validate.mjs` now checks the charset. D268: the map's allowed set never included **whitespace**, and 879 of 2,728 rows are phrases — caught by a fixture before any run, not by a paid batch.

### D265 — essentials cross-reference
Two external lists (a word list with its own priority ordering, a phrase list) cross-referenced against the dictionary by `tools/dr/essentials.mjs`. Their romanization is MSA-flavoured and is **never read**; what they contribute is which rows a learner meets first, plus call-and-response adjacency in the phrase list as free `pair` evidence.

Three match tiers, and the middle two are findings rather than merges: exact → folded (**spelling mismatch**) → english-only (**a different Arabic word for the same gloss** — usually their list has the dialectal form and ours the MSA one, which is a content problem, not orthography).

Outputs in `docs/dr/essentials/`, both source CSVs committed:

| file | rows |
|---|---|
| `essential-missing.csv` | 730, of which **92 verbs** |
| `essential-different-word.csv` | 65 |
| `essential-spelling-mismatches.csv` | 11 |
| `essential-split-cards.csv` | 13 |
| `essential-bound-morphemes.csv` | 7 |
| `essential-pairs.csv` | 6 |
| `essential-ids.json` | the 615 ids judged first |

### D266 — the level rubric had a defect
Old rules 4/5 (formal caps at level 4, slang caps at 3) are replaced in `dr-spec.md` §2.4: **register does not cap level**. Arabic diglossia means formal register does not imply low encounter-frequency — `na3am` and `keef 7aalak` are early words. Level is decided by **encounter likelihood in daily life**. New rule 5: a register pair sits at the same level or one apart. `prompt-content.mjs`'s `LEVEL_RUBRIC_TEXT` matches.

### D267 — D141's deferred second pass is eliminated
Of D141's eight deferrals, six are human work; only `pair` and `constituents` were model-collectable, and the deferral reasoning was partly wrong — `constituents` was specced as dictionary **ids** (impossible inside a 60-row batch), but surface text plus offline resolution works. Both fields now come off the same call at no extra cost.

## 2. Runs on disk

| run_id | rows | status |
|---|---|---|
| `dr-essential-2026-09-14` | 615 | **the MVP content** |
| `dr-formula-2026-09-14b` | 32 | **use this** — carries `pair`/`constituents` |
| `dr-formula-2026-09-14` | 32 | superseded, kept per §7.8 |
| `dr-full-2026-09-13` | 360 | **superseded — do not promote** (old scheme, old rubric) |

Spend: **~$9.19** on the Claude Code account, against the $36 ceiling.

Results on the 615: **level 1 = 95 rows (16%)**, was 1-5 per 60 batch. **`review_confidence` 3 = 34%**, was 8% CLI / 18% API. **Zero retired digits.** P6 = 0.178, was 0.092.

Formula re-judge: 32/32 constituents, 16/32 pairs, correctly discriminating — `shukran` and `law sama7t` have no conventional reply and correctly carry none. Pairs internally consistent in both directions. Against the 6 harvested pairs: 2 agree, 2 outside the subset, 2 differ (one spacing-only, one substantive).

## 3. Bugs found and fixed, worth knowing about

1. **Tracker bug (D223).** The B4 bullet attributed the 91-row `review_confidence`-3 pool to `level_conf` alone. Re-pulling the 60 staged rows showed `enum_conf` M on 37/60 as well. A level-targeted prompt fix would have burned the only affordable run. Rows fixed in-session.
2. **`judge-cli: exited 1 — ` with no cause.** `runCli` read only stderr on non-zero exit, but `--output-format json` writes its error envelope to **stdout** and leaves stderr empty. Two real jobs died silently. `describeFailure` now reads stdout first.
3. **`parseObjects` unguarded `JSON.parse`.** One malformed object threw out of the whole function, discarding good rows and **bypassing §7.5's repair retry**, which lives in the caller. Now collects unparsed slices on a non-enumerable property.
4. **Shell escape artefact** — `'"'"'` written literally into the prompt, 8 occurrences, would have gone to the model.
5. **`pair`/`constituents` never emitted — three diagnoses, only the third right.** Not the contract-table omission, not the discouraging wording: the **worked JSON example was a `formula` row showing neither field**, and the model copied it. Found only by dumping the rendered prompt bytes. The same example was also stale on the scheme (`mabrook` where D262/D210 make it `mabruuk`) — teaching the exact error P10 exists to catch.
6. **Decision-number collision** with the parallel §E block 3 branch: both claimed D249-D253. Renumbered mine to D260-D264 **by content, never by matching the number**, verifying §E's own references at `PROJECT_SPEC.md` E.10/E.11/E.12/E.15 stayed intact.
7. **Org monthly spend limit (429)** at 600/615 rows. Not a code failure — the risk chat 25 named when it first rejected `claude -p`. Limit raised, last 15 rows completed.

## 4. P6, read twice

First reading: the 0.30 floor is wrong for this corpus — verbs are 12.9% of the dictionary, so no prompt can reach it.

Then the essentials list came in at **40% verbs**. The floor is **right** — it is derived from a real beginner curriculum — and **our dictionary is short ~92 essential verbs**. P6 at 0.178 is mostly a corpus finding, not a levelling defect. That correction supersedes the first reading.

## 5. Live decisions, Marwan's call

- **P6** at 0.178 against the 0.30 floor: add the 92 verbs, lower the floor, or accept.
- Which of the 730 missing entries to add.
- The 65 different-word rows: synonym, replacement, or ignore.
- `تصبح على خير` — phrase list says `تلاقي خير`, model says `وإنت من أهل الخير`. Both attested.
- Whether to merge the 16-commit branch.

Available on his word: judge the remaining 2,113 rows (~$30 warm, explicitly deferred — "essential first, this will be enough to ship the MVP"); amend `PROJECT_SPEC.md` §C4.6 prose; run the 40-row native spot check.

**Blocked:** promotion to `dictionary` (G1-G8) until P6 resolves.

## 6. Constraints still in force

- **Do not fall back to the API key.** `DR_ANTHROPIC_KEY` bills a card; run every DR job as `env -u DR_ANTHROPIC_KEY ...`.
- **Do not raise D247's $36 under any circumstance** — if the ceiling would be hit first, halt and report.
- Old Supabase project `xkhulybdrxdzakarivvi` is **read-only always**. DR writes go to `pniwgnjljpkiimssortp` only; `dictionary` is written **once**, at promotion, behind G1-G8.
- §7.5 never edit model output to make the schema pass · §7.6 halt on any non-2xx · §7.7 raw model output never becomes a file in git · §7.8 a genuine re-judgement takes a new `run_id`.
- Browser-only: never propose a local CLI step for Marwan's machine.
