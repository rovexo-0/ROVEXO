-- Phase 2: AI moderation queue, reports, and audit logs

do $do$ begin
  create type public.moderation_decision as enum ('approved', 'warning', 'blocked');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.moderation_target as enum (
    'listing', 'listing_image', 'message', 'profile', 'conversation'
  );
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.moderation_queue_status as enum (
    'pending', 'approved', 'warning', 'blocked', 'overridden'
  );
exception when duplicate_object then null;
end $do$;

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.moderation_target not null,
  target_id uuid not null,
  product_slug text,
  reason text not null,
  details text not null default '',
  status public.moderation_queue_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_reports_status_idx on public.content_reports (status, created_at desc);
create index if not exists content_reports_target_idx on public.content_reports (target_type, target_id);

create table if not exists public.moderation_queue (
  id uuid primary key default gen_random_uuid(),
  target_type public.moderation_target not null,
  target_id uuid not null,
  product_id uuid references public.products (id) on delete set null,
  seller_id uuid references public.profiles (id) on delete set null,
  source text not null default 'system',
  decision public.moderation_decision not null,
  confidence numeric(5, 4) not null default 0,
  categories jsonb not null default '[]'::jsonb,
  summary text not null default '',
  status public.moderation_queue_status not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  reviewer_id uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  override_decision public.moderation_decision,
  override_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists moderation_queue_status_idx on public.moderation_queue (status, created_at desc);
create index if not exists moderation_queue_target_idx on public.moderation_queue (target_type, target_id);
create index if not exists moderation_queue_seller_idx on public.moderation_queue (seller_id, created_at desc);

create table if not exists public.moderation_audit_logs (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid references public.moderation_queue (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  previous_status public.moderation_queue_status,
  new_status public.moderation_queue_status,
  decision public.moderation_decision,
  notes text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists moderation_audit_logs_queue_idx on public.moderation_audit_logs (queue_id, created_at desc);

alter table public.products
  add column if not exists moderation_status public.moderation_decision not null default 'approved',
  add column if not exists moderation_confidence numeric(5, 4) not null default 0,
  add column if not exists moderation_summary text not null default '',
  add column if not exists moderation_reviewed_at timestamptz;

alter table public.messages
  add column if not exists moderation_decision public.moderation_decision,
  add column if not exists moderation_warning text;

drop trigger if exists content_reports_updated_at on public.content_reports;
create trigger content_reports_updated_at before update on public.content_reports
  for each row execute function public.set_updated_at();

drop trigger if exists moderation_queue_updated_at on public.moderation_queue;
create trigger moderation_queue_updated_at before update on public.moderation_queue
  for each row execute function public.set_updated_at();

alter table public.content_reports enable row level security;
alter table public.moderation_queue enable row level security;
alter table public.moderation_audit_logs enable row level security;

drop policy if exists "content_reports_insert_authenticated" on public.content_reports;
create policy "content_reports_insert_authenticated"
  on public.content_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "content_reports_select_own" on public.content_reports;
create policy "content_reports_select_own"
  on public.content_reports for select
  to authenticated
  using (auth.uid() = reporter_id or public.is_admin());

drop policy if exists "moderation_queue_admin_all" on public.moderation_queue;
create policy "moderation_queue_admin_all"
  on public.moderation_queue for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "moderation_audit_logs_admin_select" on public.moderation_audit_logs;
create policy "moderation_audit_logs_admin_select"
  on public.moderation_audit_logs for select
  to authenticated
  using (public.is_admin());

drop policy if exists "moderation_audit_logs_admin_insert" on public.moderation_audit_logs;
create policy "moderation_audit_logs_admin_insert"
  on public.moderation_audit_logs for insert
  to authenticated
  with check (public.is_admin());
