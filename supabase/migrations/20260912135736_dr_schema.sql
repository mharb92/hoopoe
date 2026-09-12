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
