-- Match schedule table for upcoming Gabby UTD fixtures.
-- Review and run in the Supabase SQL Editor.

create table if not exists public.schedules (
  id bigint generated always as identity primary key,
  opponent text not null,
  opponent_logo text default 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_icon.jpg',
  away_logo text default 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_icon.jpg',
  match_date date not null,
  match_time time,
  location text,
  match_type text not null default '공식전',
  note text,
  created_at timestamptz not null default now()
);

alter table public.schedules
add column if not exists opponent_logo text;

alter table public.schedules
add column if not exists away_logo text;

alter table public.schedules
add column if not exists match_time time;

alter table public.schedules
alter column opponent_logo set default 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_icon.jpg';

alter table public.schedules
alter column away_logo set default 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_icon.jpg';

update public.schedules
set opponent_logo = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_icon.jpg'
where opponent_logo is null or btrim(opponent_logo) = '';

update public.schedules
set away_logo = 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_icon.jpg'
where away_logo is null or btrim(away_logo) = '';

create or replace function public.set_schedule_default_logos()
returns trigger
language plpgsql
as $$
begin
  if new.opponent_logo is null or btrim(new.opponent_logo) = '' then
    new.opponent_logo := 'https://bdsatcdfwqgrlbqvikte.supabase.co/storage/v1/object/public/away_icon/away_icon.jpg';
  end if;

  if new.away_logo is null or btrim(new.away_logo) = '' then
    new.away_logo := new.opponent_logo;
  end if;

  return new;
end;
$$;

drop trigger if exists tr_set_schedule_default_logos on public.schedules;
create trigger tr_set_schedule_default_logos
before insert or update on public.schedules
for each row
execute function public.set_schedule_default_logos();

alter table public.schedules enable row level security;

drop policy if exists "public read schedules" on public.schedules;
create policy "public read schedules"
on public.schedules
for select
to anon, authenticated
using (true);
