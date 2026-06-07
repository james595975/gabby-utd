-- DFL round number for match result cards.
-- Review and run in the Supabase SQL Editor.

alter table public.matches
add column if not exists round_number int;

with official_matches as (
  select
    id,
    row_number() over (order by coalesce(date, ''), id) as computed_round
  from public.matches
  where coalesce(is_practice, false) = false
)
update public.matches as matches
set round_number = official_matches.computed_round
from official_matches
where matches.id = official_matches.id
  and matches.round_number is null;

create index if not exists idx_matches_round_number
on public.matches (round_number);
