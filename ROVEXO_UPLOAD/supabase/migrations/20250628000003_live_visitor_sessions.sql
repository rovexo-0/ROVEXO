-- Live visitor sessions for platform realtime country analytics (heartbeat fallback)

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
