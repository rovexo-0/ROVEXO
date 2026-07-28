-- ROVEXO Absolute Blood Law XLIV
-- Full Demo Certification Environment
-- Session-scoped demo listing copies · zero production mutation · fail-closed teardown

-- Demo certification sessions
create table if not exists public.demo_certification_sessions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active'
    check (status in ('active', 'destroying', 'destroyed', 'failed')),
  blood_law text not null default 'XLIV',
  created_at timestamptz not null default now(),
  destroyed_at timestamptz null,
  production_fingerprint jsonb not null default '{}'::jsonb,
  wallet_snapshot jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists demo_certification_sessions_status_idx
  on public.demo_certification_sessions (status, created_at desc);

-- Artifacts created inside a session (products, orders, offers, …) — teardown SSOT
create table if not exists public.demo_session_artifacts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.demo_certification_sessions (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (session_id, entity_type, entity_id)
);

create index if not exists demo_session_artifacts_session_idx
  on public.demo_session_artifacts (session_id, entity_type);

-- Product demo-copy columns (never edit originals — only copies set these)
alter table public.products
  add column if not exists is_demo boolean not null default false,
  add column if not exists demo_session_id uuid null references public.demo_certification_sessions (id) on delete set null,
  add column if not exists original_listing_id uuid null references public.products (id) on delete set null;

create index if not exists products_is_demo_idx on public.products (is_demo)
  where is_demo = true;

create index if not exists products_demo_session_idx on public.products (demo_session_id)
  where demo_session_id is not null;

comment on column public.products.is_demo is
  'XLIV: true only for session-scoped demo copies. Production catalogue must exclude these.';
comment on column public.products.demo_session_id is
  'XLIV: owning demo certification session. Deleted with session teardown.';
comment on column public.products.original_listing_id is
  'XLIV: source production listing id. Original must never be mutated by demo flows.';

alter table public.demo_certification_sessions enable row level security;
alter table public.demo_session_artifacts enable row level security;

-- Service role / admin only — no authenticated client writes
drop policy if exists demo_cert_sessions_admin on public.demo_certification_sessions;
create policy demo_cert_sessions_admin
  on public.demo_certification_sessions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists demo_session_artifacts_admin on public.demo_session_artifacts;
create policy demo_session_artifacts_admin
  on public.demo_session_artifacts for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
