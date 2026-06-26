-- Tier 1B: ROVEXO Image Storage Engine + file connector mappings
-- Idempotent: safe to re-run when partially applied.

create table if not exists public.store_migration_image_assets (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  content_hash text not null,
  source_url text,
  bucket text not null default 'products',
  paths jsonb not null default '{}'::jsonb,
  width integer,
  height integer,
  bytes integer,
  status text not null default 'stored',
  created_at timestamptz not null default now(),
  unique (seller_id, content_hash)
);

create index if not exists store_migration_image_assets_seller_idx
  on public.store_migration_image_assets (seller_id, created_at desc);

alter table public.store_migration_image_assets enable row level security;

drop policy if exists "store_migration_image_assets_select_own" on public.store_migration_image_assets;
create policy "store_migration_image_assets_select_own"
  on public.store_migration_image_assets for select
  using (seller_id = auth.uid() or public.is_admin());

drop policy if exists "store_migration_image_assets_insert_own" on public.store_migration_image_assets;
create policy "store_migration_image_assets_insert_own"
  on public.store_migration_image_assets for insert
  with check (
    seller_id = auth.uid()
    and public.current_user_role() in ('seller', 'business', 'admin')
  );

drop policy if exists "store_migration_image_assets_update_own" on public.store_migration_image_assets;
create policy "store_migration_image_assets_update_own"
  on public.store_migration_image_assets for update
  using (seller_id = auth.uid() or public.is_admin());

create table if not exists public.store_migration_file_mapping_templates (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,
  name text not null default 'default',
  mapping jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (seller_id, platform, name)
);

create index if not exists store_migration_file_mapping_templates_seller_idx
  on public.store_migration_file_mapping_templates (seller_id, platform);

alter table public.store_migration_file_mapping_templates enable row level security;

drop policy if exists "store_migration_file_mapping_templates_select_own" on public.store_migration_file_mapping_templates;
create policy "store_migration_file_mapping_templates_select_own"
  on public.store_migration_file_mapping_templates for select
  using (seller_id = auth.uid() or public.is_admin());

drop policy if exists "store_migration_file_mapping_templates_insert_own" on public.store_migration_file_mapping_templates;
create policy "store_migration_file_mapping_templates_insert_own"
  on public.store_migration_file_mapping_templates for insert
  with check (
    seller_id = auth.uid()
    and public.current_user_role() in ('seller', 'business', 'admin')
  );

drop policy if exists "store_migration_file_mapping_templates_update_own" on public.store_migration_file_mapping_templates;
create policy "store_migration_file_mapping_templates_update_own"
  on public.store_migration_file_mapping_templates for update
  using (seller_id = auth.uid() or public.is_admin());

drop policy if exists "store_migration_file_mapping_templates_delete_own" on public.store_migration_file_mapping_templates;
create policy "store_migration_file_mapping_templates_delete_own"
  on public.store_migration_file_mapping_templates for delete
  using (seller_id = auth.uid() or public.is_admin());
