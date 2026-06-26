-- Store migration jobs (Bring Your Items) — architecture for bulk import / store migration

create table if not exists public.store_migration_jobs (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  import_method text not null,
  status text not null default 'draft'
    check (status in ('draft', 'queued', 'processing', 'completed', 'failed')),
  progress_percent integer not null default 0
    check (progress_percent >= 0 and progress_percent <= 100),
  estimated_seconds integer,
  stats jsonb not null default '{"imported":0,"ready":0,"warnings":0,"completed":0}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_migration_jobs_seller_created_idx
  on public.store_migration_jobs (seller_id, created_at desc);

create index if not exists store_migration_jobs_status_idx
  on public.store_migration_jobs (status);

alter table public.store_migration_jobs enable row level security;

drop policy if exists "store_migration_jobs_seller_select" on public.store_migration_jobs;
create policy "store_migration_jobs_seller_select"
  on public.store_migration_jobs for select
  to authenticated
  using (auth.uid() = seller_id);

drop policy if exists "store_migration_jobs_seller_insert" on public.store_migration_jobs;
create policy "store_migration_jobs_seller_insert"
  on public.store_migration_jobs for insert
  to authenticated
  with check (auth.uid() = seller_id);

drop policy if exists "store_migration_jobs_seller_update" on public.store_migration_jobs;
create policy "store_migration_jobs_seller_update"
  on public.store_migration_jobs for update
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

grant select, insert, update on public.store_migration_jobs to authenticated;
