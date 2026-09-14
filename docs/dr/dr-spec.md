# DR spec — dictionary review, `level`, enums, formula pairs

Status: draft for approval · chat 12 · source table `dictionary`, 2,728 rows, `modular-rebuild-5`
Supersedes the review prompt drafted 2026-09-11 (that draft used `rank` as a frequency proxy; retired).

---

## 1. Scope

DR is content work, not a spec section. Blocks §J placement bank, §J unit catalogue, Phase 2 package. Runs alongside D-J.

Deliverables:

| # | output | new? |
|---|---|---|
| 1 | `level` 1-5 on every row | new column (D30) |
| 2 | `arabic_vocalised` on every row | new column (D103) |
| 3 | `register` enum replacing `dialect_tag` | conversion (D121) |
| 4 | `form_origin` enum | new column, see §4 |
| 5 | `pos` normalised to fixed enum | conversion |
| 6 | `romanization` normalised to D47 Arabizi | rewrite |
| 7 | `track_id` = `palestinian` on every row | backfill (D114) |
| 8 | `formula_pair` table populated | new table, see §5 |
| 8b | constituent dictionary ids on every `formula` and `frame` row | new column (D133) |
| 9 | `function_words` allowlist | new table (C5.5) |
| 10 | linguistic corrections (meaning, harakaat, root, conjugation, gender) | in-place edits |
| 11 | category names frozen | no schema change |

Edit rule unchanged: in-place row edits only. Ids are referenced by the unit catalogue, placement bank and item sets. No delete-and-reimport.

---

## 2. `level` — definition

> **Level N** = a learner who has cleared band N can be assumed to handle essentially everything at levels 1 to N.

Global across the whole dictionary, not within `category` or `pos`. This is forced by three consumers:

- C5.2 distractor rule: *same `pos`, same level, different `category`*. Unsatisfiable if level is category-relative.
- C3 unit gate: unit enters when its minimum level ≤ learner band. Units span categories.
- C5 known pool: generated text may use only items at or below the unit level.

`rank` is generation batch order and is retired as a difficulty signal (chat 3; harvest §553 records the old build failing on exactly this).

### 2.1 What level 1 is

Three strands, all required. A level 1 set that is missing any strand is wrong.

| strand | contents |
|---|---|
| **A. Sentence machinery** | pronouns, the core verb spine in dialect form, negation (مش، ما), بدي, question words, prepositions, quantifiers, core connectors |
| **B. Core concrete lexis** | the nouns and adjectives you cannot describe a day without |
| **C. Obligatory formulas** | greetings, farewells, politeness, core blessings — including both halves of every call-and-response pair |

Strand C is not a concession. Palestinian Arabic runs on call-and-response; مبروك without الله يبارك فيك is not teachable. Token count is irrelevant to level: مبروك is a complete conversational turn, not a one-word noun.

### 2.2 External calibration signal

`learnlevantine.com/dictionary/essentials` (public page metadata, not the paywalled list): 667 essential words out of a 2,785-word dictionary, split 270 verbs / 225 nouns / 90 adjectives / 82 functionals.

Three usable signals, no content copied:

1. **40% verbs.** Their essentials are verb-dominated. Our levels 1-2 must be too.
2. **34% nouns**, against 960 eligible nouns in our 2,602-row pool. Our dictionary skews nominal; naive assignment will over-promote nouns.
3. **24% essential** of a near-identically sized dictionary (2,785 vs our 2,728). If their "essential" ≈ our levels 1+2, that is roughly 650 rows across both.

These are bounds for a sanity check, never quotas. Assignment follows the rubric; §7 checks the result against these and flags divergence for a human, it does not force it.

Gap cross-check against their full list is a **manual** step for Marwan as a subscriber (§6), not an automated diff.

### 2.3 Rubric — worked anchors

Assign by asking: *how early does a learner need this to form and survive Palestinian sentences?* Not how frequent, not how hard.

| level | test | anchors (real row ids) |
|---|---|---|
| **1** | needed in week 1 to say anything at all, or an obligatory social move | 1 أنا · 18 وين · 56 مش · 66 بدي · 500 كان · 529 راح · 622 أكل · 982 كبير · 1046 مي · 1091 بيت · 230/231 السلام عليكم / وعليكم السلام · 240 الحمد لله · 263 شكرا · 268 لو سمحت · 280 إن شاء الله · 284/285 مبروك / الله يبارك فيك |
| **2** | needed to hold an ordinary daily conversation beyond survival | 1285 سيارة · 282 الله يعطيك العافية · everyday household, food, family, time, body terms; second-tier verbs (جاب، بعت، استنى، نسي) |
| **3** | needed to talk about a topic rather than a situation; the working middle | 887 مستشفى · 525 دوّر · domain nouns across work, school, health, city; abstract adjectives in common use |
| **4** | lower-frequency, more specific, or register-marked | narrower domain vocabulary, most idioms, most slang (393 قصف جبهة), less common verb forms |
| **5** | rare, literary, formal, or highly regional | 341 بالنسبة لـ · 342 بخصوص · 148 هسّا and other regional variants · low-frequency formal connectors |

### 2.4 Hard rules

1. **Pairs share a level.** Both halves of a `formula_pair` get the same level. No judgement.
2. **Regional variants sit at least one level above their base form.** هسّا (148) is a variant of هلّأ; the base form is learned first.
3. **`form_origin = msa_identical` is not evidence of low level.** بالنسبة لـ is MSA-identical and level 5.
4. **Register does not cap level (amended chat 26, D266).** The original rule capped `formal` at 4 and `slang` at 3 on the assumption that formal register implies low encounter-frequency. That is true in English and **false in Arabic**, where diglossia puts formal forms inside ordinary daily politeness: نعم، كيف حالك، تفضل، لو سمحت are all formal and all heard on day one. The rule also contradicted the construct — §2.1 strand C makes obligatory social moves level 1, and نعم is one. Level is decided by encounter likelihood; register is evidence toward it, never a ceiling. Bookish MSA sits high because it is rarely met, not because it is formal.
5. **A register pair sits at the same level or one apart**, never further. كيفك and كيف حالك are one move in two registers.
6. **Frames and formulas are levelled by need, not by length.** A 4-word formula can be level 1; a 1-word domain noun can be level 4.

---

## 3. `pos` enum

Current values are inconsistent and `Phrase` (879) vs `Expression` (87) has no stated distinction. Replace with:

| value | meaning |
|---|---|
| `noun` `verb` `adjective` `adverb` `pronoun` `preposition` `conjunction` `particle` `interjection` | single lexemes, as now |
| `formula` | a fixed multi- or single-token utterance functioning as a whole conversational turn — مبروك، شكرا، إن شاء الله، وعليكم السلام |
| `frame` | a productive pattern with a variable slot — بدي أروح، شو بدك؟، ما بدي إشي |

`Phrase` and `Expression` are both retired. The 227 rows in `Sentence Patterns` are the `frame` core; `Blessings & Wishes`, `Greetings`, `Politeness`, `Farewells` are the `formula` core.

Why this matters beyond tidiness: C5.2 picks distractors by `pos`. Without the split, a formula can be offered as a distractor for a frame, which is trivially eliminable and corrupts the item.

---

## 4. `register` and `form_origin` — the `dialect_tag` split

The existing `dialect_tag` conflates two orthogonal axes. Legend reconstructed from the `notes` column (there was no documented legend):

| tag | n | what it actually encodes |
|---|---|---|
| `D` | 1,277 | dialect-distinctive form (notes carry "MSA: ..." counterparts) |
| `M` | 1,119 | MSA-shared lexeme, dialect pronunciation (notes carry "Urban ق→ء") |
| `S` | 210 | identical to MSA (notes say "Same as MSA") |
| `SL` | 63 | slang / youth register |
| `MSA` | 50 | formal register, educated speech |
| `D-var` | 9 | regional variant of a dialect form |

`D`/`M`/`S`/`D-var` describe **form provenance**. `SL`/`MSA` describe **register**. A word can be both dialect-distinctive and slang, and the single column forces a false choice. Split into two columns:

```
register     := neutral | slang | formal
form_origin  := dialect | msa_shared_dialect_pron | msa_identical | regional_variant
```

Conversion, deterministic where possible:

| old | register | form_origin |
|---|---|---|
| `D` | neutral | dialect |
| `M` | neutral | msa_shared_dialect_pron |
| `S` | neutral | msa_identical |
| `D-var` | neutral | regional_variant |
| `SL` | **slang** | needs judgement (default `dialect`) |
| `MSA` | **formal** | msa_identical |

The 63 `SL` and 50 `MSA` rows are the only ones needing per-row judgement on `form_origin`. Everything else converts by rule.

C2.2's source filter becomes `register = 'neutral'` (was `register ≠ MSA`).

`form_origin` is also a level prior: `msa_identical` and `msa_shared_dialect_pron` rows are the ones a heritage speaker is most likely to already know, which matters for placement discrimination.

---

## 5. `formula_pair`

Call-and-response is structural in Palestinian Arabic, not stylistic. If a lesson teaches مبروك it must teach الله يبارك فيك.

**Not a column.** The relation is many-to-many both ways: الحمد لله answers كيفك، شو أخبارك، كيف صحتك; مبروك takes الله يبارك فيك or الله يبارك فيكي by addressee gender.

```sql
create table formula_pair (
  id            serial primary key,
  track_id      text not null default 'palestinian',
  prompt_id     int  not null references dictionary(id),
  response_id   int  not null references dictionary(id),
  addressee     text,            -- m | f | pl | null (any)
  obligatory    boolean not null default true,
  notes         text,
  unique (prompt_id, response_id, addressee)
);
```

`obligatory = true` means the response is socially required, not merely possible. Only obligatory pairs bind the level rule and the C5.5 validator.

**Population is authoring, not extraction.** Only 30 rows mention a reply anywhere in `english` or `notes`, and inconsistently: row 231 وعليكم السلام is marked "(reply)" with no link to 230 السلام عليكم. The work spans the ~272 rows in Blessings & Wishes (89), Greetings (51), Politeness (39), Farewells (22), Exclamations (32) and Conversational Fillers (39). Cheap now while every row is being read; expensive later.

### 5.1 Downstream hooks this unblocks

| consumer | rule |
|---|---|
| C5.5 validator | if an item set contains a `formula` that is an obligatory prompt, its response is in the same set or already in the learner's store — blocking at publish |
| D54 item sets | a pair occupies 2 of the 6 declared ids |
| C2.2 placement bank | two halves of a pair are never distractors for each other |
| C8 checkpoints | the evaluator can score whether the learner returned the expected response |
| C9 audio | pairs generate as a unit, prompt on voice A, response on voice B |

---

## 6. Gap cross-check (manual)

After the pass, a candidate level 1+2 list is produced sorted by `pos` so it can be read block against block. Marwan compares it by eye against his `learnlevantine.com` subscription and returns 3 buckets: corroborated, under-levelled (our row exists, our level too high), missing (no row at all).

Missing entries become new rows appended at the end of the id sequence. No renumbering.

No credentials are handled and no third-party list is ingested, held or diffed automatically.

---

## 7. Acceptance floors

Checked after assignment, before promotion. A breach flags for human decision; it does not auto-rebalance.

| # | floor | why |
|---|---|---|
| F1 | ≥ 20 eligible single-token rows per level (`register = neutral`, `confidence ≥ 4`) | C2.2 needs ~100 bank items across 5 bands |
| F2 | ≥ 6 eligible ids per unit level | D54 item sets are 6 declared ids |
| F3 | verbs ≥ 30% of levels 1-2 combined | external signal is 40%; below 30% means the nominal skew won |
| F4 | ≥ 1 `formula` in level 1 per pair category | strand C is present, not dropped |
| F5 | every obligatory pair has both halves at the same level | §2.4 rule 1 |
| F6 | levels 1+2 land within 450-850 rows | external bound is ~650; outside this range needs an explanation |
| F7 | no level is empty | staircase needs 5 bands |

---

## 8. Open items for §F and the tracker

Flagged, not assumed. These change approved sections:

1. **§F** gains `formula_pair`, `function_words`, and the `level` / `arabic_vocalised` / `register` / `form_origin` / `track_id` columns.
2. **C2.2** source filter changes to `register = 'neutral'`, plus a new condition so obligatory formulas can be level 1 without entering the bank as non-discriminating items (everyone knows الحمد لله; it measures nothing).
3. **C5.2** distractor rule reads the new `pos` enum, and must exclude pair partners.
4. **C5.5** gains the pair-completeness validator (§5.1).
5. **D78** counts a 4-token formula as one "word learned", same as a noun. Fine, but it should be a stated decision since B8's success threshold reads that number.
6. **New decisions** for the log: `level` construct and 3 strands; `pos` enum with formula/frame; `dialect_tag` → `register` + `form_origin` split; `formula_pair` table; manual gap cross-check.

Tracker and PROJECT_SPEC edits are **not** applied here. Say the word and they come back as complete updated files.
