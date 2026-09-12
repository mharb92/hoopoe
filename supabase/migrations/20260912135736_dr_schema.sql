-- Hoopoe DR schema. Full recipe: recreates dictionary and the three DR tables
-- from empty. Idempotent; safe to replay against an existing project.
-- Data is not included. Restore rows from tools/dr/snapshots/dict-preDR.json.

-- base table (originally created in the Table Editor, recorded here)
create table if not exists dictionary (
  id            serial primary key,
  rank          int,
  arabic        text,
  romanization  text,
  english       text,
  pos           text,
  category      text,
  root          text,
  conjugation   text,
  gender        text,
  dialect_tag   text,
  notes         text,
  confidence    int,
  created_at    timestamptz default now()
);

-- columns on dictionary (added before the pass, empty)
alter table dictionary add column if not exists level            int;
alter table dictionary add column if not exists arabic_vocalised text;
alter table dictionary add column if not exists register         text;
alter table dictionary add column if not exists form_origin      text;
alter table dictionary add column if not exists track_id         text not null default 'palestinian';

-- staging: one row per dictionary row per run
create table if not exists dictionary_review (
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
create index if not exists dictionary_review_run_id_status_idx
  on dictionary_review (run_id, status);

create table if not exists formula_pair (
  id           serial primary key,
  track_id     text not null default 'palestinian',
  prompt_id    int  not null references dictionary(id),
  response_id  int  not null references dictionary(id),
  addressee    text,
  obligatory   boolean not null default true,
  notes        text,
  unique (prompt_id, response_id, addressee)
);

create table if not exists function_words (
  dictionary_id int primary key references dictionary(id),
  track_id      text not null default 'palestinian'
);

-- RLS (enabled in the dashboard when the tables were created)
alter table dictionary        enable row level security;
alter table dictionary_review enable row level security;
alter table formula_pair      enable row level security;
alter table function_words    enable row level security;

-- grants: new-project defaults do not extend to service_role for tables
-- created by hand, so PostgREST writes fail with 42501 without these
grant all on table dictionary, dictionary_review, formula_pair, function_words to service_role;
grant usage, select on all sequences in schema public to service_role;

-- after restoring dictionary rows with explicit ids, resync the sequence:
--   select setval('dictionary_id_seq', (select max(id) from dictionary));
