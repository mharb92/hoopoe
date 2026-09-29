# External dictionary comparison (chat 31)

Compares our `dictionary` against a Levantine dictionary, to check our data's accuracy and find what we're missing. The output is a CSV of differences for Marwan to analyse outside the repo. Final calls then go through the same close-out as Q25 (D269): before-values committed, in-place edit rule, every write verified. **Nothing here writes to the database.**

## 1. Scope
- **Source**: `docs/dr/external/levantine-dictionary.csv`, 1,786 rows, sha256 `e6fe21dbfe57cf3fa9a2badd94dd7544fd7a4929f71f1d304a2455a7d96f6881`. Content cleared for use in the app (Marwan, chat 31). **This is the same source as the D265 essentials word list**: 466 of that list's 674 words match it exactly on Arabic, harakaat and English. So it validates our content, not our choice of which words are essential.
- **Levelling**: our levels are authoritative and are not compared at all (Marwan, chat 31). Their `Level` is dropped.
- **What it checks is what D276 scores**: is the word right, is the definition right, is the pronunciation right. The gloss check (4.2) is the only external check on our definitions, since the DR prompt never rated confidence in `meaning`.
- **It can only lower confidence, never raise it (D276).** Agreement is weak evidence, because their vowel marking is partial: of the 147 MVP rows held on pronunciation, 19 agree with theirs on two or more marked letters. A verdict of `ours_wrong` caps the row at `review_confidence` 2 at promotion, like an unapplied correction.
- **Handled like D265/D269**: a script does the matching and writes CSVs, then Marwan reviews them. What's new is harakaat comparison, the ى/ا fold, a gloss check, and a small model verdict on the rows the script can't settle.

## 2. Inputs
- **Theirs**: the CSV above.
  - Rows are deduped on (`Word`, `Meaning`), giving 1,579 unique pairs; `Topic` values are joined with `|`.
  - `Level` and `Root` are dropped. `Root` mostly repeats the word itself.
  - `Transliteration` goes to the model as context only. It is never compared with ours and never adopted; D262 is our scheme.
  - `Feminine`, `Plural`, `Superlative` and `OtherVariants` are carried through to the CSV unread.
- **Ours**, snapshotted once to `runs/<run_id>/ours.json` with its sha256 before anything is compared (the chat-14 migration pattern). Every step reads the snapshot, never the live tables.
  - Fields: `dictionary` `id`, `arabic`, `english`, `pos`.
  - Plus each id's one round-2 Opus 5.5 judgement (`dr-essential-o55-2026-09-27` or `dr-finalize-2026-09-27`, D273) from `payload.model`: `level`, `pos`, `arabic_vocalised.value`, `romanization.value`, and `review_confidence` re-derived with the D276 `routeRow`. `level` is carried to the CSV for context only.
  - Harakaat are compared against `arabic_vocalised.value`, the value promotion writes, falling back to `arabic` when it's null.
- **MVP flag**: `docs/dr/essentials/essential-ids-final.json`, 619 ids.

## 3. Normalisation (matching only, never written back)
| tier | rule |
|---|---|
| T0 exact | identical string |
| T1 skeleton | strip harakaat (U+064B-U+0652, U+0670) and tatweel |
| T2 folded | T1, then أ إ آ ٱ → ا, ة → ه, word-final ى / ا / ي one class, whitespace collapsed |
| T3 article | T2, with leading ال / il- stripped on both sides |

- T2's word-final fold is the fix for the D265 matcher, which folded ى → ي only and so missed إجى against our إِجَا (530) and استنّا against استنّى (520).
- A match at T2 or T3 records which rule it needed; that becomes the `discrepancy` text.

## 4. Script (no model, no cost)
### 4.1 Letter match
Each unique pair of theirs is matched against ours at the lowest tier that hits. If a match hits several of our ids (homographs), the gloss check (4.2) picks the one whose gloss agrees; if none or several agree, all are kept, one output row each.

### 4.2 Gloss check
Both glosses are normalised: lowercase; drop a leading `to `, parentheticals and `e.t.c.`/`etc`; split on `/`, `,` and ` or `. The result is `agree` if any normalised sense is equal, or one contains the other as whole words; otherwise it's `disagree`.
- Our verbs are glossed in the past tense ("came") and theirs as infinitives ("To come"), which the script can't equate. A verb `disagree` therefore goes to the model rather than straight to `meaning_mismatch`.

### 4.3 Harakaat compare (letter matches only)
The two words are aligned letter by letter on the T1 skeleton; for a T3 match, on the part after the article. For each letter, a mark set is read on each side: shadda, plus one of fatha, damma, kasra, sukun, or the tanween marks.
- **Only letters marked on both sides are compared.** A missing mark is not a difference, since about half the source is lightly vocalised: فطور and شوربة carry none.
- Sukun against no mark is ignored.
- Shadda present on one side against a vowel without shadda on the other *is* a difference, because gemination is phonemic.
- Any compared difference makes the row `harakaat_variant`, and each one is written out, e.g. `letter 1: ours i, theirs a (عِمِل / عَمَل)`.

### 4.4 Flag (information, not a category)
- `pos_gap`: verb against non-verb only, in either direction. Their `functional` is not compared.

### 4.5 Category, one per row
| category | rule | goes to model |
|---|---|---|
| `same` | T0 or T1, gloss `agree`, no harakaat difference | no |
| `spelling_variant` | T2 or T3 match, gloss `agree`, no harakaat difference | no: our spelling convention decides |
| `harakaat_variant` | letter match with at least one compared harakaat difference | yes |
| `meaning_mismatch` | letter match, gloss `disagree` | yes |
| `different_word` | no letter match; gloss equals one of our glosses (4.2) | yes |
| `only_theirs` | no letter match, no gloss match | yes |

- A row is exported if its category is not `same`, or if `pos_gap` is set.
- Our ids that nothing matches go to `only-ours.csv` with no model call. That file is a coverage signal, not an accuracy one: theirs is mostly single words, ours has 879 phrases.

## 5. Model step
Only for categories marked "yes" in 4.5.
- **Transport**: `judge-cli`, run as `env -u DR_ANTHROPIC_KEY ...` (D260). Model `claude-opus-5-5` (D273), pin asserted by `readEnvelope`.
- **Batches**: 60 rows each.
- **Effort**: `medium` for `harakaat_variant`, `low` for everything else. These run as separate batches, so each batch has one effort level.
- **Spend cap**: `--spend-cap 15`. The estimate is under $6: at most ~1,500 of the 1,579 unique pairs, at roughly $0.002-0.004 each.
- **Checks**: each batch must return every key exactly once, with one repair call allowed. Every enum must be valid, and `fix` must be Arabic script only. On failure the batch stops and the run reports; nothing is patched by hand.

### 5.1 Prompt
**System**
> You compare entries from two Levantine Arabic dictionaries. OURS is a Palestinian Arabic dictionary for learners. THEIRS is a pan-Levantine dictionary, with no dialect marking, that may include Lebanese, Syrian or Jordanian forms and MSA. Your only job is to say, for each row, whether OURS is correct Palestinian Arabic as spoken day to day, and whether THEIRS is Palestinian.
>
> Rules:
> - Palestinian here means everyday urban and village Palestinian speech. A form that is only Lebanese, Syrian, Jordanian or MSA is not Palestinian, even if a Palestinian would understand it.
> - Harakaat: some differences are regional (for example kasra against fatha in a verb stem). Say `both_valid` only if both are heard in Palestinian speech. If OURS is the only Palestinian form, say `keep_ours`.
> - Glosses: our verbs are glossed in the past tense and theirs as infinitives. That is not a meaning difference.
> - Do not judge romanization, level or register. Do not suggest improvements beyond the verdict.
> - When unsure, lower `c`; never guess `ours_wrong`.
>
> Reply with one JSON object per line, in input order, and nothing else.

**User (per batch)**
> Category: `<category>`. Each line is one row:
> `{"k":"<key>","ours":{"ar":"<arabic_vocalised>","en":"<english>","pos":"<pos>"},"theirs":{"ar":"<Word>","tr":"<Transliteration>","en":"<Meaning>","pos":"<Category>"},"diff":"<script discrepancy>"}`
>
> For `only_theirs` rows `ours` is null. For `different_word` rows `ours` is the entry with the matching gloss.

**Output contract**, one line per row:
`{"k":"<key>","v":"<verdict>","d":"<dialect>","c":"H|M|L","fix":"<arabic, only if v=ours_wrong>","n":"<note, max 12 words, only if v=ours_wrong or add>"}`

| `v` | meaning | valid for |
|---|---|---|
| `keep_ours` | ours is correct Palestinian; theirs is another region's form, MSA, or an error | `harakaat_variant`, `meaning_mismatch`, `different_word` |
| `both_valid` | both are used in Palestinian speech | `harakaat_variant`, `different_word` |
| `ours_wrong` | ours is wrong or not Palestinian; `fix` gives the Palestinian form | `harakaat_variant`, `meaning_mismatch`, `different_word` |
| `same_sense` | the glosses are worded differently but mean the same thing | `meaning_mismatch` |
| `add` | Palestinian, a real lexeme, worth adding | `only_theirs` |
| `skip` | not Palestinian, MSA-only, or not a lexeme | `only_theirs` |

`d` is theirs' dialect: `pal`, `lev_other`, `msa` or `unsure`.

## 6. Outputs, at `runs/ext-compare-<date>/`
- `ours.json` and `theirs-deduped.json`, each with its sha256.
- **`differences.csv`**, the deliverable. Columns: `category`, `verdict`, `their_dialect`, `conf`, `discrepancy`, `note`, `fix`, `pos_gap`, `our_confidence`, `mvp`, `our_id`, `our_arabic`, `our_romanization`, `our_english`, `our_pos`, `our_level`, `their_word`, `their_transliteration`, `their_meaning`, `their_category`, `their_topics`, `their_feminine`, `their_plural`, `their_superlative`, `their_other_variants`.
  - Sorted with MVP rows first, then `our_confidence` 3 before 2 before 1 (a row we would teach that the source contradicts is the most valuable find), then by category, with `ours_wrong` first within each category.
- `only-ours.csv`: `our_id`, `mvp`, `our_confidence`, `our_arabic`, `our_english`, `our_pos`, `our_level`.
- `summary.json`: counts per category and verdict, the same counts split by `our_confidence`, the pos cross-tab, MVP coverage, and cost from the CLI envelope.

## 7. Build
- **Code**: `tools/dr/external-compare.mjs`. Pure functions for 3-4.5, reusing `parseCsv` and `toCsv` from `essentials.mjs`, plus a thin runner for §5 over `judge-cli.mjs`.
- **Tests**: `node:test` cases for every tier in §3, the partial-vocalisation and shadda rules in 4.3, the gloss check, and the category table; the stub judge covers §5's checks.
- **Order**: build and test → dry run (script only, prints the category counts and projected cost) → Marwan sees the counts → model step.
