# DR batch prompt — frozen

Injected verbatim by the batch runner, once per batch. Rubric anchors and enums come from `dr-spec.md` §2-§5 and are pasted into the placeholders below at runtime so the prompt is self-contained.

Model: Opus for the linguistic pass. Set inside the runner's API call, independent of the orchestrating session.

---

## System

```
You are reviewing rows from a Palestinian Arabic dictionary before it is imported
into a rebuilt learning app. It is the vocabulary source for every lesson, so an
error here spreads everywhere.

Target variety: urban Palestinian (ق → glottal stop). Rural and Hebron forms are
variants, not errors.

You output structured judgements only. You do not write to any database. Every
change you propose is staged; a human approves anything you are not confident about.

CALIBRATION WARNING. You are stronger on MSA than on Palestinian dialect. If a form
is plausible Palestinian, do not "correct" it toward MSA. When unsure, lower your
confidence rather than inventing a fix. A wrong confident correction is far more
expensive than a flagged uncertainty.

<<ENUMS>>          -- pos, register, form_origin, level (dr-spec §2.3, §3, §4)
<<LEVEL_RUBRIC>>   -- the 3 strands, worked anchors, and the 6 hard rules (dr-spec §2)
<<ROMANIZATION>>   -- the D47 Arabizi standard and its character map
```

## User (per batch)

```
Rows <<N>> of 2,728. Batch <<B>>.

<<TSV>>
id, arabic, romanization, english, pos, category, root, conjugation, gender,
dialect_tag, notes, confidence

For each row return one object. Judge these fields:

1. level         1-5 per the rubric. Required on every row.
2. pos           map to the new enum. Note formula vs frame explicitly.
3. register      neutral | slang | formal
4. form_origin   dialect | msa_shared_dialect_pron | msa_identical | regional_variant
5. romanization  rewrite to the Arabizi standard. Flag if the existing value
                 disagrees with the Arabic rather than just the scheme.
6. arabic_vocalised   fully vowelled, spelling out DIALECT pronunciation, not MSA.
                 This is the TTS input and the harakaat display source.
7. corrections   meaning, harakaat, gender, root, conjugation, notes. Only where wrong.
8. pair          if this row is half of an obligatory call-and-response, name the
                 other half by its Arabic. The runner resolves it to an id.
9. constituents  formula and frame rows only: list the dictionary lexemes the row is
                 built from, by Arabic. The runner resolves to ids. Validator input
                 only (D133); it never credits those lexemes with any learning.

Rules:
- Never restate a clean row's unchanged fields. Omit what you are not changing.
- Do not flag anything a rule fix already covers (character encoding, tag conversion,
  scheme-wide romanization changes). Those run as one deterministic pass.
- Regional variants are variants, not errors.
- Confidence H means: a native speaker would agree without hesitation. Anything else
  is M or L.
- Reason strings: 15 words maximum.
```

---

## Output contract

One JSON object per row. No prose, no markdown fences.

```json
{
  "id": 284,
  "level": 1,
  "level_reason": "obligatory congratulation formula, needed week 1",
  "level_conf": "H",
  "pos": "formula",
  "register": "neutral",
  "form_origin": "msa_identical",
  "romanization": {"value": "mabrook", "conf": "H", "changed": true},
  "arabic_vocalised": {"value": "مَبْرُوك", "conf": "H"},
  "pair": {"role": "prompt", "partner_arabic": "الله يبارك فيك",
           "addressee": "m", "obligatory": true, "conf": "H"},
  "corrections": [
    {"field": "notes", "current": null, "suggested": "reply is 285",
     "type": "notes", "reason": "pair partner not recorded", "conf": "M"}
  ],
  "constituents": ["بدي", "راح"],
  "native_check": false
}
```

### Field rules

| field | required | notes |
|---|---|---|
| `id` | yes | must match the input row |
| `level`, `level_reason`, `level_conf` | yes | every row, no exceptions |
| `pos`, `register`, `form_origin` | yes | enum values only, no free text |
| `romanization` | yes | `changed: false` if already conformant |
| `arabic_vocalised` | yes | every row |
| `pair` | no | omit unless the row is half of a pair |
| `corrections` | no | omit if empty; never emit an entry with no change |
| `native_check` | yes | `true` forces human review regardless of conf |

`corrections[].type` ∈ `meaning, harakaat, romanization, gender, pos, root, conjugation, tag, notes, duplicate, gap, variant`

### Routing

| confidence | destination |
|---|---|
| `H` and `native_check: false` | auto-applied at promotion |
| `M`, `L`, or `native_check: true` | adjudication worksheet, human decides |

Per-field, not per-row. A row can have an auto-applied `level` and a held `root`.

Every `pair` claim is held for human review in the first pass regardless of confidence — pairs bind the level rule and a wrong pair propagates.

---

## Batching

`level` is global, so a category-ordered batch would anchor each batch to its own category's internal spread and produce drift. Colours would get a full 1-5 range.

**Batch by stratified random sample**, ~120 rows, drawn across all 46 categories in proportion. Every batch sees the real spread. Seeded and recorded so the run is reproducible.

Two exceptions batched together rather than sampled, because they need to be seen as a set:

- the 272 social-formula rows (Blessings, Greetings, Politeness, Farewells, Exclamations, Fillers) — pairs are only findable when both halves are in view
- closed sets (Numbers, Colours, Days & Months, Pronouns, Question Words) — gap detection needs the whole set

---

## Rule-fix pass (deterministic, no model)

Runs before the model pass. These are not judgements and must not consume model attention:

| fix | scope |
|---|---|
| `track_id` = `palestinian` | all 2,728 rows |
| `dialect_tag` → `register` + `form_origin` | all rows except the 63 `SL` and 50 `MSA` (those go to the model) |
| Persian ی ک → Arabic ي ك; strip tatweel and zero-width chars | all rows |
| strip stray whitespace | all rows |
| Latin characters in `arabic`, Arabic characters in `romanization` | flag only |
| duplicate detection: exact Arabic, harakaat-stripped Arabic, same English within a category | flag only |
| `rank` retained untouched | historical, no longer a difficulty signal |
