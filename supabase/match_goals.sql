-- Goal records for match detail pages.
-- Review and run in the Supabase SQL Editor.

create table if not exists public.match_goals (
  id bigint generated always as identity primary key,
  match_id bigint not null references public.matches(id) on delete cascade,
  scorer_name text not null,
  minute integer,
  team text not null default 'home' check (team in ('home', 'away')),
  note text,
  created_at timestamptz not null default now()
);

alter table public.match_goals enable row level security;

drop policy if exists "public read match goals" on public.match_goals;
create policy "public read match goals"
on public.match_goals
for select
to anon, authenticated
using (true);
