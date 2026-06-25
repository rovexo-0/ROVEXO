-- ROVEXO Trust Score System — tiers, audit, security hardening

do $do$ begin
create type public.trust_tier as enum (
  'bronze',
  'silver',
  'gold',
  'platinum',
  'diamond'
)
;
exception when duplicate_object then null;
end $do$;

alter table public.trust_scores
  add column if not exists tier public.trust_tier not null default 'bronze',
  add column if not exists score_locked boolean not null default false,
  add column if not exists lock_reason text,
  add column if not exists factors_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists recommendations jsonb not null default '[]'::jsonb,
  add column if not exists last_recalculated_at timestamptz;

alter table public.trust_events
  add column if not exists idempotency_key text,
  add column if not exists reason text,
  add column if not exists actor_id uuid references public.profiles (id) on delete set null;

create unique index if not exists trust_events_idempotency_key_idx
  on public.trust_events (idempotency_key)
  where idempotency_key is not null;

create index if not exists trust_events_type_idx
  on public.trust_events (user_id, event_type, created_at desc);

create table if not exists public.trust_admin_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  delta integer,
  score_before integer,
  score_after integer,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists trust_admin_audit_user_idx
  on public.trust_admin_audit (user_id, created_at desc);

create index if not exists trust_admin_audit_admin_idx
  on public.trust_admin_audit (admin_id, created_at desc);

alter table public.trust_admin_audit enable row level security;

drop policy if exists "trust_scores_self_update" on public.trust_scores;
drop policy if exists "trust_scores_admin_update" on public.trust_scores;
create policy "trust_scores_admin_update"
  on public.trust_scores for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "trust_admin_audit_admin_read" on public.trust_admin_audit;
create policy "trust_admin_audit_admin_read"
  on public.trust_admin_audit for select
  to authenticated
  using (public.is_admin());

drop policy if exists "trust_admin_audit_admin_insert" on public.trust_admin_audit;
create policy "trust_admin_audit_admin_insert"
  on public.trust_admin_audit for insert
  to authenticated
  with check (public.is_admin());

comment on column public.trust_scores.tier is 'Marketplace trust tier derived from score (bronze–diamond)';
comment on column public.trust_scores.score_locked is 'When true, automated recalculation is skipped';
comment on table public.trust_admin_audit is 'Immutable audit log for admin trust score actions';
