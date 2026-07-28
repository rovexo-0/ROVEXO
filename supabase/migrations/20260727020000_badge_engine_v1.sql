-- ROVEXO Badge Engine v1.0 — emergency overrides + immutable audit
-- Does not modify Rating / Reviews / Reputation engines.

create table if not exists public.badge_overrides (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null,
  action text not null check (action in ('force_disable', 'force_enable')),
  reason text not null,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table if not exists public.badge_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_id text not null,
  action text not null,
  reason text not null,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists badge_audit_log_user_idx
  on public.badge_audit_log (user_id, created_at desc);

alter table public.badge_overrides enable row level security;
alter table public.badge_audit_log enable row level security;

comment on table public.badge_overrides is
  'Badge Engine v1.0 — Super Admin emergency overrides only. Normal badges are calculated.';
comment on table public.badge_audit_log is
  'Badge Engine v1.0 — immutable audit log for emergency overrides.';

notify pgrst, 'reload schema';
