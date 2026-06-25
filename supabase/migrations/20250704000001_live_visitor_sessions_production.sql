-- Reconcile live visitor analytics schema on production (idempotent)
-- Ensures enterprise live analytics tables/columns exist even if prior
-- duplicate-version migrations were partially applied.

create table if not exists public.live_visitor_sessions (
  session_id text primary key,
  country_code text not null,
  country_name text not null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint live_visitor_sessions_country_code_check check (char_length(country_code) between 2 and 3)
);

create index if not exists live_visitor_sessions_last_seen_idx
  on public.live_visitor_sessions (last_seen_at desc);

create index if not exists live_visitor_sessions_country_idx
  on public.live_visitor_sessions (country_code, last_seen_at desc);

alter table public.live_visitor_sessions enable row level security;

alter table public.live_visitor_sessions
  add column if not exists city text,
  add column if not exists device_category text,
  add column if not exists browser text,
  add column if not exists operating_system text,
  add column if not exists traffic_source text;

create index if not exists live_visitor_sessions_city_idx
  on public.live_visitor_sessions (city)
  where city is not null;

create index if not exists live_visitor_sessions_device_idx
  on public.live_visitor_sessions (device_category);
