# DR runbook — staging, gates, promotion

The live `dictionary` is never written to during DR. Every judgement lands in staging; promotion is one reviewed SQL step that produces a diff.

Bulk pass runs in Claude Code as a resumable batch job. Chat's job was freezing `dr-spec.md` and `dr-prompt.md`; it is done.

---

## 1. New schema

```sql
-- columns on dictionary (added before the pass, empty)
alter table dictionary add column if not exists level            int;
alter table dictionary add column if not exists arabic_vocalised text;
alter table dictionary add column if not exists register         text;
alter table dictionary add column if not exists form_origin      text;
alter table dictionary add column if not exists track_id         text not null default 'palestinian';

-- staging: one row per dictionary row per run
create table dictionary_review (
  id             serial primary key,
  run_id         text not null,
  dictionary_id  int  not null references dictionary(id),
  batch_no       int  not null,
  payload        jsonb not null,        -- the model's object, verbatim
  status         text not null default 'pending',
                 -- pending | auto | held | approved | rejected | applied
  reviewer_note  text,
  created_at     timestamptz default now(),
  unique (run_id, dictionary_id)
);
create index on dictionary_review (run_id, status);

create table formula_pair (
  id           serial primary key,
  track_id     text not null default 'palestinian',
  prompt_id    int  not null references dictionary(id),
  response_id  int  not null references dictionary(id),
  addressee    text,
  obligatory   boolean not null default true,
  notes        text,
  unique (prompt_id, response_id, addressee)
);

create table function_words (
  dictionary_id int primary key references dictionary(id),
  track_id      text not null default 'palestinian'
);
```

`payload` stays verbatim so the pass is auditable and re-promotable without re-running the model.

---

## 2. Run order

| # | step | where | writes |
|---|---|---|---|
| 1 | snapshot `dictionary` to `dict-preDR.json`, record sha256 | runner | file |
| 2 | add the 5 columns and 3 tables | SQL | schema only |
| 3 | deterministic rule-fix pass (`dr-prompt.md` §rule-fix) | runner | `dictionary_review` as `auto` |
| 4 | model pass, stratified batches of ~120 + the 2 grouped batches | runner, Opus | `dictionary_review` as `pending` |
| 5 | route by confidence → `auto` or `held` | runner | status only |
| 6 | acceptance floors F1-F7 (`dr-spec.md` §7) | runner | report |
| 7 | adjudication worksheet for everything `held` | chat or Cowork | `approved` / `rejected` |
| 8 | native spot check on a sample | human | `reviewer_note` |
| 9 | promotion | SQL | `dictionary`, `formula_pair` |
| 10 | post-promotion diff vs snapshot | runner | report |

Resumability: the job keys off `(run_id, dictionary_id)`. A killed run restarts at the first row with no staging entry. Cost is metered per batch.

---

## 3. Gates

Promotion is blocked until all pass.

| gate | condition |
|---|---|
| G1 | every one of the 2,728 rows has a staging entry with a non-null `level` |
| G2 | no `pending` rows remain |
| G3 | acceptance floors F1-F7 pass, or each breach carries a recorded decision |
| G4 | every `pair` claim is `approved` or `rejected` — none auto-applied |
| G5 | both halves of every approved obligatory pair resolve to real ids at the same level |
| G6 | `register`, `form_origin`, `pos`, `level` contain only enum values |
| G7 | native spot check complete on ≥ 5% sample, weighted to level 1-2 |
| G8 | `romanization` passes the D47 validator on 100% of rows |

G7's weighting matters: level 1-2 errors reach every learner in week 1 and also gate the C9.10 audio review, which listens to 100% of word clips at level 1-2.

---

## 4. Promotion

```sql
begin;

update dictionary d set
  level            = coalesce((r.payload->>'level')::int, d.level),
  register         = coalesce(r.payload->>'register', d.register),
  form_origin      = coalesce(r.payload->>'form_origin', d.form_origin),
  pos              = coalesce(r.payload->>'pos', d.pos),
  romanization     = coalesce(r.payload->'romanization'->>'value', d.romanization),
  arabic_vocalised = coalesce(r.payload->'arabic_vocalised'->>'value', d.arabic_vocalised)
from dictionary_review r
where r.dictionary_id = d.id
  and r.run_id = :run_id
  and r.status in ('auto','approved');

update dictionary_review set status = 'applied'
where run_id = :run_id and status in ('auto','approved');

commit;
```

Corrections in `payload->'corrections'` apply per-field in a second statement, only where that entry's own status is `auto` or `approved`. A row can have an applied `level` and a rejected `root`.

Rollback is the snapshot from step 1 plus the untouched `payload` column.

---

## 5. After promotion

1. **Category names freeze.** The C3 unit catalogue references them (D32).
2. **`romanization_map` freezes** (C4.7).
3. **Candidate level 1+2 list** exported sorted by `pos` for the manual gap cross-check (`dr-spec.md` §6). Marwan returns corroborated / under-levelled / missing.
4. **Missing rows appended** at the end of the id sequence. No renumbering, ever.
5. **Dependent content marked for revalidation** where `arabic`, `romanization` or `arabic_vocalised` changed (C5.11), and dependent clips marked for regeneration (C9.1). At DR time nothing is published yet, so this is a no-op on the first run and a live requirement on any later correction.
6. **Level assignment is falsifiable.** After the family test, placement attempt data gives observed accuracy per item. Any item whose observed accuracy contradicts its assigned level is re-levelled. The first pass does not have to be perfect, and this should be a named §H follow-up rather than an assumption.

---

## 6. What this does not cover

- Which rows enter the placement bank. That is §J, reading `register`, `level` and the new non-discriminating-formula condition (`dr-spec.md` §8 item 2).
- Edit versioning. Still Q16, open, lands in §F.
- The `function_words` allowlist contents. Populated from `pos in (particle, preposition, conjunction, pronoun)` plus adjudication, after promotion.
