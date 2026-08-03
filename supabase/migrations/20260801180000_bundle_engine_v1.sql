-- ROVEXO Bundle Engine v1.0
-- LISTING → BUNDLE → CHECKOUT
-- Exactly ONE active bundle per buyer. Exactly ONE seller per active bundle.
-- Authority: database. Fail closed. Atomic. Audited.

create type public.bundle_status as enum (
  'active',
  'offer_pending',
  'checkout',
  'paid',
  'cancelled',
  'expired',
  'discarded'
);

create type public.bundle_offer_status as enum (
  'pending',
  'countered',
  'accepted',
  'declined',
  'expired',
  'cancelled'
);

create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete restrict,
  seller_display_name text not null default '',
  status public.bundle_status not null default 'active',
  currency text not null default 'GBP' check (char_length(currency) = 3),
  conversation_id uuid null references public.conversations (id) on delete set null,
  order_id uuid null references public.orders (id) on delete set null,
  checkout_session_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz null,
  constraint bundles_buyer_ne_seller check (buyer_id <> seller_id)
);

-- Exactly ONE active bundle per buyer (Owner Absolute Rule).
create unique index if not exists bundles_one_active_per_buyer_uidx
  on public.bundles (buyer_id)
  where status = 'active';

create index if not exists bundles_seller_id_idx
  on public.bundles (seller_id, updated_at desc);

create index if not exists bundles_status_idx
  on public.bundles (status, updated_at desc);

comment on table public.bundles is
  'Bundle Engine v1.0 — one active bundle per buyer; one seller per active bundle.';

create table if not exists public.bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.bundles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  product_slug text not null,
  title text not null,
  image_url text not null default '',
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  max_stock_snapshot integer not null check (max_stock_snapshot > 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bundle_id, product_id)
);

create index if not exists bundle_items_bundle_id_idx
  on public.bundle_items (bundle_id);

create index if not exists bundle_items_product_id_idx
  on public.bundle_items (product_id);

comment on table public.bundle_items is
  'Bundle Engine v1.0 line items. Totals derived in engine — never duplicated owners.';

-- Owner name: bundle_offer (singular concept). Table: bundle_offers (SQL convention).
create table if not exists public.bundle_offers (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.bundles (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  message text null,
  status public.bundle_offer_status not null default 'pending',
  parent_offer_id uuid null references public.bundle_offers (id) on delete set null,
  conversation_id uuid null references public.conversations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bundle_offers_bundle_id_idx
  on public.bundle_offers (bundle_id, created_at desc);

create index if not exists bundle_offers_buyer_id_idx
  on public.bundle_offers (buyer_id, created_at desc);

create index if not exists bundle_offers_seller_id_idx
  on public.bundle_offers (seller_id, created_at desc);

comment on table public.bundle_offers is
  'Bundle Engine v1.0 offers / counters. One conversation hub — no parallel threads.';

create table if not exists public.bundle_events (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.bundles (id) on delete cascade,
  actor_id uuid null references public.profiles (id) on delete set null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bundle_events_bundle_id_idx
  on public.bundle_events (bundle_id, created_at desc);

comment on table public.bundle_events is
  'Bundle Engine v1.0 audit log. Everything audited.';

alter table public.bundles enable row level security;
alter table public.bundle_items enable row level security;
alter table public.bundle_offers enable row level security;
alter table public.bundle_events enable row level security;

drop policy if exists "bundles_select_participants" on public.bundles;
create policy "bundles_select_participants"
  on public.bundles for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "bundle_items_select_participants" on public.bundle_items;
create policy "bundle_items_select_participants"
  on public.bundle_items for select
  using (
    exists (
      select 1 from public.bundles b
      where b.id = bundle_id
        and (b.buyer_id = auth.uid() or b.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "bundle_offers_select_participants" on public.bundle_offers;
create policy "bundle_offers_select_participants"
  on public.bundle_offers for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "bundle_events_select_participants" on public.bundle_events;
create policy "bundle_events_select_participants"
  on public.bundle_events for select
  using (
    exists (
      select 1 from public.bundles b
      where b.id = bundle_id
        and (b.buyer_id = auth.uid() or b.seller_id = auth.uid() or public.is_admin())
    )
  );

-- Writes via service_role / Bundle Server Engine only.
revoke all on table public.bundles from public;
revoke all on table public.bundle_items from public;
revoke all on table public.bundle_offers from public;
revoke all on table public.bundle_events from public;

grant select on table public.bundles to authenticated;
grant select on table public.bundle_items to authenticated;
grant select on table public.bundle_offers to authenticated;
grant select on table public.bundle_events to authenticated;

grant all on table public.bundles to service_role;
grant all on table public.bundle_items to service_role;
grant all on table public.bundle_offers to service_role;
grant all on table public.bundle_events to service_role;
