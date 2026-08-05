-- R1.2 — ensure seller_performance_event_queue is visible to PostgREST (clears PGRST205).
-- Idempotent: create if missing, grant service_role, reload schema cache.

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

alter table public.seller_performance_event_queue enable row level security;

drop policy if exists "seller_performance_event_queue_admin_read" on public.seller_performance_event_queue;
create policy "seller_performance_event_queue_admin_read"
  on public.seller_performance_event_queue for select
  to authenticated
  using (public.is_admin());

grant all on table public.seller_performance_event_queue to service_role;
grant select on table public.seller_performance_event_queue to authenticated;

notify pgrst, 'reload schema';
