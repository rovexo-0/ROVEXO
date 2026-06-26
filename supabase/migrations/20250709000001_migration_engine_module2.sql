-- Module 2: Universal Migration Engine extensions

alter table public.store_migration_jobs
  add column if not exists progress jsonb,
  add column if not exists report jsonb,
  add column if not exists duplicate_policy text not null default 'skip'
    check (duplicate_policy in ('skip', 'replace', 'update', 'create_new')),
  add column if not exists input_payload jsonb,
  add column if not exists items_total integer not null default 0,
  add column if not exists current_batch integer not null default 0,
  add column if not exists total_batches integer not null default 0,
  add column if not exists notify_on_complete boolean not null default true,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

create table if not exists public.store_migration_category_mappings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  source_category text not null,
  rovexo_category_slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id, platform, source_category)
);

create index if not exists store_migration_category_mappings_seller_idx
  on public.store_migration_category_mappings (seller_id, platform);

create table if not exists public.store_migration_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.store_migration_jobs (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  batch_index integer not null default 0,
  item_index integer not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'imported', 'skipped', 'duplicate', 'failed')),
  fingerprint text,
  duplicate_action text,
  existing_product_id uuid references public.products (id) on delete set null,
  normalized_data jsonb,
  warnings jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, item_index)
);

create index if not exists store_migration_items_job_idx
  on public.store_migration_items (job_id, batch_index);

alter table public.store_migration_category_mappings enable row level security;
alter table public.store_migration_items enable row level security;

drop policy if exists "store_migration_category_mappings_seller_all" on public.store_migration_category_mappings;
create policy "store_migration_category_mappings_seller_all"
  on public.store_migration_category_mappings for all
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

drop policy if exists "store_migration_items_seller_select" on public.store_migration_items;
create policy "store_migration_items_seller_select"
  on public.store_migration_items for select
  to authenticated
  using (auth.uid() = seller_id);

drop policy if exists "store_migration_items_seller_insert" on public.store_migration_items;
create policy "store_migration_items_seller_insert"
  on public.store_migration_items for insert
  to authenticated
  with check (auth.uid() = seller_id);

grant select, insert, update, delete on public.store_migration_category_mappings to authenticated;
grant select, insert on public.store_migration_items to authenticated;
