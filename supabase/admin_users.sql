-- Admin UID allow-list for Gabby UTD.
-- Review and run in the Supabase SQL Editor.

create table if not exists public.admin_users (
  uid uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

insert into public.admin_users (uid)
values ('c348daeb-51f9-4347-a3b9-6470085ef190')
on conflict (uid) do nothing;

drop policy if exists "Admins can read their own admin row" on public.admin_users;
create policy "Admins can read their own admin row"
on public.admin_users for select
to authenticated
using (auth.uid() = uid);
