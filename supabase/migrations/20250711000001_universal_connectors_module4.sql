-- Module 4: Universal Connector Framework — seller connector credentials & status

create table if not exists public.store_migration_connectors (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  connection_status text not null default 'disconnected'
    check (connection_status in ('disconnected', 'connecting', 'connected', 'error')),
  credentials_encrypted text,
  settings jsonb not null default '{}'::jsonb,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id, platform)
);

create index if not exists store_migration_connectors_seller_idx
  on public.store_migration_connectors (seller_id, platform);

alter table public.store_migration_connectors enable row level security;

drop policy if exists "store_migration_connectors_seller_select" on public.store_migration_connectors;
create policy "store_migration_connectors_seller_select"
  on public.store_migration_connectors for select
  to authenticated
  using (auth.uid() = seller_id);

drop policy if exists "store_migration_connectors_seller_insert" on public.store_migration_connectors;
create policy "store_migration_connectors_seller_insert"
  on public.store_migration_connectors for insert
  to authenticated
  with check (auth.uid() = seller_id);

drop policy if exists "store_migration_connectors_seller_update" on public.store_migration_connectors;
create policy "store_migration_connectors_seller_update"
  on public.store_migration_connectors for update
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

drop policy if exists "store_migration_connectors_seller_delete" on public.store_migration_connectors;
create policy "store_migration_connectors_seller_delete"
  on public.store_migration_connectors for delete
  to authenticated
  using (auth.uid() = seller_id);

grant select, insert, update, delete on public.store_migration_connectors to authenticated;
