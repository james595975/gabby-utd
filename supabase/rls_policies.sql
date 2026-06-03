-- Gabby UTD baseline Supabase RLS policies.
-- Run this in the Supabase SQL editor after reviewing table names/columns.
-- Public site visitors can read public team data and submit inquiries.
-- Anonymous visitors cannot read inquiries or modify site content.

alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.news enable row level security;
alter table public.formations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Public can read players" on public.players;
create policy "Public can read players"
on public.players for select
to anon
using (true);

drop policy if exists "Public can read matches" on public.matches;
create policy "Public can read matches"
on public.matches for select
to anon
using (true);

drop policy if exists "Public can read news" on public.news;
create policy "Public can read news"
on public.news for select
to anon
using (true);

drop policy if exists "Public can read formation" on public.formations;
create policy "Public can read formation"
on public.formations for select
to anon
using (true);

drop policy if exists "Public can submit messages" on public.messages;
create policy "Public can submit messages"
on public.messages for insert
to anon
with check (
  type in ('inquiry', 'join')
  and length(name) between 1 and 40
  and length(content) between 1 and 1700
);

-- Do not add anon update/delete policies for players, matches, news,
-- formations, or messages. Admin writes should go through server-side code
-- using SUPABASE_SERVICE_ROLE_KEY.
