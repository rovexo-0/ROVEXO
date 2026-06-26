-- Module 5: Universal Marketplace Connector Layer

alter table public.store_migration_connectors
  add column if not exists enabled boolean not null default true,
  add column if not exists health_status text not null default 'offline'
    check (health_status in ('healthy', 'warning', 'offline', 'authentication_expired', 'rate_limited', 'maintenance')),
  add column if not exists sync_status text not null default 'disconnected'
    check (sync_status in ('connected', 'synchronizing', 'importing', 'publishing', 'completed', 'warning', 'error', 'retry_available')),
  add column if not exists provider_version text not null default '1.0.0',
  add column if not exists last_health_check_at timestamptz;

create table if not exists public.store_marketplace_connector_events (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  event_type text not null,
  duration_ms integer,
  error_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists store_marketplace_connector_events_seller_idx
  on public.store_marketplace_connector_events (seller_id, platform, created_at desc);

alter table public.store_marketplace_connector_events enable row level security;

drop policy if exists "store_marketplace_connector_events_seller_select" on public.store_marketplace_connector_events;
create policy "store_marketplace_connector_events_seller_select"
  on public.store_marketplace_connector_events for select
  to authenticated
  using (auth.uid() = seller_id);

drop policy if exists "store_marketplace_connector_events_seller_insert" on public.store_marketplace_connector_events;
create policy "store_marketplace_connector_events_seller_insert"
  on public.store_marketplace_connector_events for insert
  to authenticated
  with check (auth.uid() = seller_id);

grant select, insert on public.store_marketplace_connector_events to authenticated;
