-- ROVEXO v1.0 — seller-level promotions (Featured Store, Boost Package)

create table if not exists public.seller_promotions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('store_featured', 'boost_package')),
  package_id text not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'scheduled', 'paused', 'expired', 'failed', 'revoked')),
  starts_at timestamptz,
  ends_at timestamptz,
  amount_cents integer not null default 0,
  granted_by_admin boolean not null default false,
  granted_by_admin_id uuid references public.profiles (id),
  stripe_session_id text,
  stripe_payment_intent_id text,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seller_promotions_seller_idx
  on public.seller_promotions (seller_id, created_at desc);

create index if not exists seller_promotions_status_idx
  on public.seller_promotions (status, ends_at);

create unique index if not exists seller_promotions_stripe_session_uidx
  on public.seller_promotions (stripe_session_id)
  where stripe_session_id is not null;

create table if not exists public.promotion_action_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id),
  actor_username text,
  user_id uuid not null references public.profiles (id),
  username text,
  promotion_type text not null,
  listing_id uuid references public.products (id) on delete set null,
  seller_promotion_id uuid references public.seller_promotions (id) on delete set null,
  listing_promotion_id uuid references public.listing_promotions (id) on delete set null,
  previous_status text,
  new_status text not null,
  reason text,
  duration_label text,
  created_at timestamptz not null default now()
);

create index if not exists promotion_action_audit_user_idx
  on public.promotion_action_audit (user_id, created_at desc);

create index if not exists promotion_action_audit_actor_idx
  on public.promotion_action_audit (actor_id, created_at desc);

alter table public.seller_promotions enable row level security;
alter table public.promotion_action_audit enable row level security;

drop policy if exists "seller_promotions_select_own" on public.seller_promotions;
create policy "seller_promotions_select_own"
  on public.seller_promotions for select
  using (auth.uid() = seller_id);

drop policy if exists "promotion_action_audit_select_own" on public.promotion_action_audit;
create policy "promotion_action_audit_select_own"
  on public.promotion_action_audit for select
  using (auth.uid() = user_id or auth.uid() = actor_id);

grant select on public.seller_promotions to authenticated;
grant select on public.promotion_action_audit to authenticated;
grant all on public.seller_promotions to service_role;
grant all on public.promotion_action_audit to service_role;
