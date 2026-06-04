-- Lightweight indexes for common Gabby UTD read paths.
-- Review and run in the Supabase SQL Editor after the table SQL files.

do $$
begin
  if to_regclass('public.matches') is not null then
    create index if not exists idx_matches_id_desc
    on public.matches (id desc);
  end if;

  if to_regclass('public.news') is not null then
    create index if not exists idx_news_id_desc
    on public.news (id desc);
  end if;

  if to_regclass('public.schedules') is not null then
    alter table public.schedules
    add column if not exists match_time time;

    create index if not exists idx_schedules_match_date_time
    on public.schedules (match_date asc, match_time asc);
  end if;

  if to_regclass('public.players') is not null then
    create index if not exists idx_players_id
    on public.players (id);

    create index if not exists idx_players_name
    on public.players (name);

    create index if not exists idx_players_back_number
    on public.players (back_number);

    create index if not exists idx_players_lineup_spot
    on public.players (lineup_spot);
  end if;

  if to_regclass('public.messages') is not null then
    create index if not exists idx_messages_id_desc
    on public.messages (id desc);
  end if;

  if to_regclass('public.match_goals') is not null then
    create index if not exists idx_match_goals_match_id_minute
    on public.match_goals (match_id, minute, id);
  end if;
end $$;
