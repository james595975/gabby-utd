-- Match schedule table for upcoming Gabby UTD fixtures.
-- Review and run in the Supabase SQL Editor.

create table if not exists public.schedules (
  id bigint generated always as identity primary key,
  opponent text not null,
  opponent_logo text,
  match_date date not null,
  location text,
  match_type text not null default '공식전',
  note text,
  created_at timestamptz not null default now()
);

alter table public.schedules
add column if not exists opponent_logo text;

alter table public.schedules enable row level security;

drop policy if exists "public read schedules" on public.schedules;
create policy "public read schedules"
on public.schedules
for select
to anon, authenticated
using (true);
