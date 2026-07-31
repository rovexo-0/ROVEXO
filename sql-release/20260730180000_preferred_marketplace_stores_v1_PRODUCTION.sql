-- Preferred Marketplace Stores v1.0 — Super Admin configurable homepage slot privileges.
-- Preferred sellers remain normal sellers in UI (no Admin/Platform badges).

create table if not exists public.preferred_marketplace_stores (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  enabled boolean not null default true,
  homepage_visibility boolean not null default true,
  promotion_priority integer not null default 100,
  min_position integer not null default 10 check (min_position >= 1),
  max_position integer not null default 15 check (max_position >= min_position),
  start_at timestamptz,
  end_at timestamptz,
  max_simultaneous_listings integer not null default 1 check (max_simultaneous_listings >= 1),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint preferred_marketplace_stores_seller_unique unique (seller_id)
);

create index if not exists preferred_marketplace_stores_enabled_priority_idx
  on public.preferred_marketplace_stores (enabled, homepage_visibility, promotion_priority desc);

alter table public.preferred_marketplace_stores enable row level security;

drop policy if exists "preferred_marketplace_stores_select_admin" on public.preferred_marketplace_stores;
create policy "preferred_marketplace_stores_select_admin"
  on public.preferred_marketplace_stores for select
  using (public.is_admin() or public.is_super_admin());

comment on table public.preferred_marketplace_stores is
  'Preferred Marketplace Stores — normal sellers with homepage ranking slot config. Super Admin only mutations via service role.';
