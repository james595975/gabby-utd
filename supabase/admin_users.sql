-- Admin UID allow-list for Gabby UTD.
-- Review and run in the Supabase SQL Editor.

create table if not exists public.admin_users (
  uid uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users
add column if not exists uid uuid;

alter table public.admin_users
add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admin_users'
      and column_name = 'user_id'
  ) then
    execute 'update public.admin_users set uid = user_id where uid is null and user_id is not null';
  end if;
end $$;

alter table public.admin_users enable row level security;

insert into public.admin_users (uid)
select 'c348daeb-51f9-4347-a3b9-6470085ef190'::uuid
where not exists (
  select 1
  from public.admin_users
  where uid = 'c348daeb-51f9-4347-a3b9-6470085ef190'::uuid
);

drop policy if exists "Admins can read their own admin row" on public.admin_users;
create policy "Admins can read their own admin row"
on public.admin_users for select
to authenticated
using (auth.uid() = uid);
