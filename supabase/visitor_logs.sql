-- Visitor IP logs for Gabby UTD.
-- The app records the server-observed IP from request headers.
-- Clients never provide their own IP address in the request body.

create table if not exists public.visitor_logs (
  id bigint generated always as identity primary key,
  ip_address text,
  path text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.visitor_logs enable row level security;

-- No anon/authenticated policies are created intentionally.
-- Inserts are performed only by the server route with SUPABASE_SERVICE_ROLE_KEY.
