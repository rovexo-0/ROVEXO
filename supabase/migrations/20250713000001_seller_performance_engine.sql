-- ROVEXO Seller Performance Engine v1.0 — Reputation SSOT tables

create table if not exists public.seller_performance_scores (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  score integer not null default 0 check (score >= 0 and score <= 100),
  level text not null default 'new_seller',
  factors_snapshot jsonb not null default '{}'::jsonb,
  component_scores jsonb not null default '{}'::jsonb,
  achievements jsonb not null default '[]'::jsonb,
  badges_granted jsonb not null default '[]'::jsonb,
  badges_revoked jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  last_recalculated_at timestamptz
);

create index if not exists seller_performance_scores_level_idx
  on public.seller_performance_scores (level, score desc);

create table if not exists public.seller_performance_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  score_before integer not null,
  score_after integer not null,
  delta integer not null,
  reason text not null,
  trigger_event text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists seller_performance_history_user_idx
  on public.seller_performance_history (user_id, created_at desc);

create table if not exists public.seller_performance_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  score_before integer,
  score_after integer,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists seller_performance_audit_user_idx
  on public.seller_performance_audit (user_id, created_at desc);

create index if not exists seller_performance_audit_admin_idx
  on public.seller_performance_audit (admin_id, created_at desc);

alter table public.seller_performance_scores enable row level security;
alter table public.seller_performance_history enable row level security;
alter table public.seller_performance_audit enable row level security;

drop policy if exists "seller_performance_scores_self_read" on public.seller_performance_scores;
create policy "seller_performance_scores_self_read"
  on public.seller_performance_scores for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "seller_performance_history_self_read" on public.seller_performance_history;
create policy "seller_performance_history_self_read"
  on public.seller_performance_history for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "seller_performance_audit_admin_read" on public.seller_performance_audit;
create policy "seller_performance_audit_admin_read"
  on public.seller_performance_audit for select
  to authenticated
  using (public.is_admin());

comment on table public.seller_performance_scores is 'Canonical seller reputation score (0–100) — ROVEXO Reputation Engine v1.0';
comment on table public.seller_performance_history is 'Immutable seller score recalculation history';
comment on table public.seller_performance_audit is 'Admin actions on seller performance (force recalc, badge grant/revoke)';
