-- DR scoped pass (D141): per-row review confidence and native verification.
-- Idempotent. Apply by hand in the browser SQL Editor on pniwgnjljpkiimssortp,
-- then commit this file unchanged as the record.

alter table dictionary add column if not exists review_confidence int;
alter table dictionary add column if not exists native_verified   boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'dictionary_review_confidence_range') then
    alter table dictionary
      add constraint dictionary_review_confidence_range
      check (review_confidence is null or review_confidence between 1 and 3);
  end if;
end $$;

create index if not exists dictionary_review_confidence_idx on dictionary (review_confidence);

-- hand-created tables do not inherit service_role privileges (chat 14)
grant all on table dictionary to service_role;

-- verification: expect 2728 / 0 / 0 / 2728
select
  count(*)                                         as rows_total,
  count(review_confidence)                         as scored,
  count(*) filter (where native_verified)          as verified,
  count(*) filter (where track_id = 'palestinian') as track_ok
from dictionary;
