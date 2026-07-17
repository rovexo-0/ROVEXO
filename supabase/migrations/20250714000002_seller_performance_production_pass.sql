-- ROVEXO Seller Performance v1.0 — production pass (event queue, badge history, audit hardening)

create table if not exists public.seller_performance_event_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed', 'flagged')),
  fraud_flags jsonb not null default '[]'::jsonb,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists seller_performance_event_queue_idempotency_idx
  on public.seller_performance_event_queue (idempotency_key);

create index if not exists seller_performance_event_queue_user_status_idx
  on public.seller_performance_event_queue (user_id, status, created_at desc);

create table if not exists public.seller_performance_badge_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null,
  action text not null check (action in ('earned', 'lost')),
  previous_badges jsonb not null default '[]'::jsonb,
  new_badges jsonb not null default '[]'::jsonb,
  reason text not null,
  trigger_event text,
  admin_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists seller_performance_badge_history_user_idx
  on public.seller_performance_badge_history (user_id, created_at desc);

alter table public.seller_performance_history
  add column if not exists admin_id uuid references public.profiles (id) on delete set null;

alter table public.seller_performance_audit
  add column if not exists ip_address text,
  add column if not exists badge_before jsonb,
  add column if not exists badge_after jsonb;

alter table public.seller_performance_event_queue enable row level security;
alter table public.seller_performance_badge_history enable row level security;

drop policy if exists "seller_performance_event_queue_admin_read" on public.seller_performance_event_queue;
create policy "seller_performance_event_queue_admin_read"
  on public.seller_performance_event_queue for select
  to authenticated
  using (public.is_admin());

drop policy if exists "seller_performance_badge_history_self_read" on public.seller_performance_badge_history;
create policy "seller_performance_badge_history_self_read"
  on public.seller_performance_badge_history for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

comment on table public.seller_performance_event_queue is 'Async reputation recalculation queue — never score during page render';
comment on table public.seller_performance_badge_history is 'Immutable badge earned/lost history';
