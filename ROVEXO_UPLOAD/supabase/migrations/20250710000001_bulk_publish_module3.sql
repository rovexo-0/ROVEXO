-- Module 3: Bulk Publish Engine & Migration Finalization

alter table public.store_migration_jobs
  add column if not exists publish_status text not null default 'idle'
    check (publish_status in ('idle', 'queued', 'publishing', 'completed', 'failed', 'cancelled')),
  add column if not exists publish_progress jsonb,
  add column if not exists publish_report jsonb,
  add column if not exists auto_publish boolean not null default false,
  add column if not exists scheduled_publish_at timestamptz,
  add column if not exists publish_batch integer not null default 0,
  add column if not exists publish_total_batches integer not null default 0;

alter table public.store_migration_items
  add column if not exists validation_status text not null default 'pending'
    check (validation_status in ('pending', 'valid', 'warning', 'invalid')),
  add column if not exists validation_errors jsonb not null default '[]'::jsonb,
  add column if not exists suggested_category_slug text,
  add column if not exists product_id uuid references public.products (id) on delete set null,
  add column if not exists publish_status text not null default 'pending'
    check (publish_status in ('pending', 'draft', 'published', 'failed', 'skipped', 'cancelled')),
  add column if not exists selected boolean not null default true;

create index if not exists store_migration_items_publish_idx
  on public.store_migration_items (job_id, publish_status);

create index if not exists store_migration_jobs_publish_status_idx
  on public.store_migration_jobs (seller_id, publish_status, updated_at desc);
