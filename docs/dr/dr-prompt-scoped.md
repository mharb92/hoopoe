# DR batch prompt — scoped variant (D141)

Injected verbatim by the batch runner, once per batch. Replaces `dr-prompt.md` for the scoped pass only; that file stays frozen and unedited and returns for the second pass.

Differences from the frozen prompt: fields 8 (`pair`) and 9 (`constituents`) are removed, `enum_conf` is added, and the grouped-batch rule is gone because pairs are no longer being detected. Everything else is the frozen text, including the calibration warning, which is the main thing this prompt is carrying.

Amended by D210 (chat 19): vowel length is a per-row judgement inside the produced `romanization` value. It sits explicitly outside the rule-fix suppression and is never a `corrections` entry.

Model: Opus. Set inside `judge.mjs`, independent of the orchestrating session.

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
5. romanization  rewrite to the Arabizi standard. Vowel length is decided from the
                 word itself and never carried over from the existing value: the five
                 long vowels never collapse, and the current data conflates oo/uu and
                 ee/ii, so the existing string is not evidence. Flag if the existing
                 value disagrees with the Arabic rather than just the scheme.
6. arabic_vocalised   fully vowelled, spelling out DIALECT pronunciation, not MSA.
                 This is the TTS input and the harakaat display source.
7. corrections   meaning, harakaat, gender, root, conjugation, notes. Only where wrong.

Rules:
- Never restate a clean row's unchanged fields. Omit what you are not changing.
- Do not flag anything a rule fix already covers (character encoding, tag conversion,
  scheme-wide romanization changes). Those run as one deterministic pass. Vowel length
  is not one of them. No rule can recover it from the existing value, so it is your
  judgement, it belongs in the romanization value, and it is never a corrections entry.
- Regional variants are variants, not errors.
- Confidence H means: a native speaker would agree without hesitation. Anything else
  is M or L.
- Reason strings: 15 words maximum.
- Do not report call-and-response partners or constituent lexemes. They are out of
  scope for this pass and are collected separately later.
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
  "enum_conf": "H",
  "romanization": {"value": "mabrook", "conf": "H", "changed": true},
  "arabic_vocalised": {"value": "مَبْرُوك", "conf": "H"},
  "corrections": [
    {"field": "notes", "current": null, "suggested": "congratulation formula",
     "type": "notes", "reason": "usage not recorded", "conf": "M"}
  ],
  "native_check": false
}
```

### Field rules

| field | required | notes |
|---|---|---|
| `id` | yes | must match the input row |
| `level`, `level_reason`, `level_conf` | yes | every row, no exceptions |
| `pos`, `register`, `form_origin` | yes | enum values only, no free text |
| `enum_conf` | yes | one confidence covering all three enum fields |
| `romanization` | yes | `changed: false` only if already conformant, vowel length included |
| `arabic_vocalised` | yes | every row |
| `corrections` | no | omit if empty; never emit an entry with no change |
| `native_check` | yes | `true` forces human review regardless of conf |

`corrections[].type` ∈ `meaning, harakaat, romanization, gender, pos, root, conjugation, tag, notes, duplicate, gap, variant`

Vowel length never appears in `corrections`. It is part of the `romanization` value. Routing it through corrections would cap almost every long-vowel row at `review_confidence` 2 and collapse the MVP content pool, which filters on 3 (D210).

Corrections are collected and staged. This pass applies none of them.

### Routing and score

Per field, not per row, as in the frozen contract: a row can have an auto-applied `level` and a held `root`. Row `status` stays coarse; per-field detail goes to `payload.routing` (`dr-runner-spec.md` §7.2).

`review_confidence` 1-3 is derived at promotion per `dr-scoped-pass.md` §3 and written to `dictionary`. It is the filter MVP content selection uses.

---

## Batching

Stratified random sample across all 46 categories in proportion, seeded and recorded so the run is reproducible. `level` is global, so category-ordered batches would anchor each batch to its own category's spread and drift.

No grouped batches in this pass: the 272-row social-formula set and the closed sets existed for pair and gap detection, both deferred.
