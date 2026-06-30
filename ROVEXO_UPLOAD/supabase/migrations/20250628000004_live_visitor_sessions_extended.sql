-- Extend live visitor sessions for enterprise analytics dimensions

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
