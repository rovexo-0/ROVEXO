-- ============================================================================
-- ROVEXO Commerce Engine v1.0 — Phase 1 Foundation
-- ============================================================================
-- Additive + idempotent. Creates the canonical, IMMUTABLE financial ledger
-- tables that back the Commerce Engine (the single financial authority).
--
-- Design rules enforced here:
--   * All ledger tables are append-only (immutability triggers block UPDATE/DELETE),
--     except shipping_reserve which is a running balance (mutable spent_amount).
--   * No INSERT/UPDATE/DELETE RLS policies for auth users => only service_role
--     (the Commerce Engine via the admin client) may write. This enforces
--     "no module may modify wallet/escrow/refund/shipping directly" at the DB layer.
--   * Participants (buyer/seller) and admins may SELECT their own rows.
--
-- This migration does NOT change any existing table, enum, or money-movement
-- behavior. It only adds new tables.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Immutability guard (shared by append-only ledger tables)
-- ---------------------------------------------------------------------------
create or replace function public.commerce_prevent_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'commerce_engine: % on % is forbidden (append-only ledger)', tg_op, tg_table_name
    using errcode = 'check_violation';
  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- commerce_audit_logs — immutable audit of every financial action (spec: audit_logs)
-- Namespaced to avoid collision with existing public.platform_audit_logs.
-- ---------------------------------------------------------------------------
create table if not exists public.commerce_audit_logs (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  order_id uuid references public.orders (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  actor_id uuid references public.profiles (id) on delete set null,
  engine text not null default 'commerce',
  rule text,
  result text,
  amount numeric(12, 2),
  currency text not null default 'GBP',
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists commerce_audit_logs_order_idx on public.commerce_audit_logs (order_id, created_at desc);
create index if not exists commerce_audit_logs_user_idx on public.commerce_audit_logs (user_id, created_at desc);
create index if not exists commerce_audit_logs_event_idx on public.commerce_audit_logs (event, created_at desc);
create index if not exists commerce_audit_logs_correlation_idx on public.commerce_audit_logs (correlation_id) where correlation_id is not null;

-- ---------------------------------------------------------------------------
-- escrow_events — immutable escrow lifecycle ledger
-- ---------------------------------------------------------------------------
create table if not exists public.escrow_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null,
  from_state text,
  to_state text,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'GBP',
  reason text,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists escrow_events_order_idx on public.escrow_events (order_id, created_at desc);
create index if not exists escrow_events_seller_idx on public.escrow_events (seller_id, created_at desc);

-- ---------------------------------------------------------------------------
-- refund_events — immutable refund ledger (full / partial / shipping)
-- ---------------------------------------------------------------------------
create table if not exists public.refund_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  buyer_id uuid references public.profiles (id) on delete set null,
  seller_id uuid references public.profiles (id) on delete set null,
  refund_type text not null default 'full' check (refund_type in ('full', 'partial', 'shipping')),
  amount numeric(12, 2) not null default 0,
  currency text not null default 'GBP',
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  stripe_refund_id text,
  reason text,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists refund_events_order_idx on public.refund_events (order_id, created_at desc);
create unique index if not exists refund_events_stripe_refund_uidx
  on public.refund_events (stripe_refund_id) where stripe_refund_id is not null;

-- ---------------------------------------------------------------------------
-- shipping_reserve — Reserved Shipping Wallet (running balance per order).
-- Internal ledger reconciled against the (untouched) Parcel2Go prepay path.
-- MUTABLE: spent_amount / status change as labels are drawn down.
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_reserve (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  seller_id uuid references public.profiles (id) on delete set null,
  reserved_amount numeric(12, 2) not null default 0 check (reserved_amount >= 0),
  spent_amount numeric(12, 2) not null default 0 check (spent_amount >= 0),
  currency text not null default 'GBP',
  provider text,
  status text not null default 'reserved' check (status in ('reserved', 'partially_spent', 'spent', 'released', 'refunded')),
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id)
);

create index if not exists shipping_reserve_seller_idx on public.shipping_reserve (seller_id, created_at desc);
create index if not exists shipping_reserve_status_idx on public.shipping_reserve (status);

-- ---------------------------------------------------------------------------
-- shipping_transactions — immutable shipping money-movement ledger
-- (reserve / debit / refund against shipping_reserve)
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  reserve_id uuid references public.shipping_reserve (id) on delete set null,
  direction text not null check (direction in ('reserve', 'debit', 'refund', 'release')),
  amount numeric(12, 2) not null default 0,
  currency text not null default 'GBP',
  provider text,
  carrier text,
  reference text,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists shipping_transactions_order_idx on public.shipping_transactions (order_id, created_at desc);
create index if not exists shipping_transactions_reserve_idx on public.shipping_transactions (reserve_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Immutability triggers (append-only ledgers)
-- ---------------------------------------------------------------------------
drop trigger if exists commerce_audit_logs_immutable on public.commerce_audit_logs;
create trigger commerce_audit_logs_immutable
  before update or delete on public.commerce_audit_logs
  for each row execute function public.commerce_prevent_mutation();

drop trigger if exists escrow_events_immutable on public.escrow_events;
create trigger escrow_events_immutable
  before update or delete on public.escrow_events
  for each row execute function public.commerce_prevent_mutation();

drop trigger if exists refund_events_immutable on public.refund_events;
create trigger refund_events_immutable
  before update or delete on public.refund_events
  for each row execute function public.commerce_prevent_mutation();

drop trigger if exists shipping_transactions_immutable on public.shipping_transactions;
create trigger shipping_transactions_immutable
  before update or delete on public.shipping_transactions
  for each row execute function public.commerce_prevent_mutation();

-- shipping_reserve is a running balance: allow UPDATE, keep updated_at fresh.
drop trigger if exists shipping_reserve_updated_at on public.shipping_reserve;
create trigger shipping_reserve_updated_at before update on public.shipping_reserve
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Participants/admins may SELECT their own rows. NO write policies for auth
-- users => only service_role (the Commerce Engine) may INSERT/UPDATE.
-- ---------------------------------------------------------------------------
alter table public.commerce_audit_logs enable row level security;
alter table public.escrow_events enable row level security;
alter table public.refund_events enable row level security;
alter table public.shipping_reserve enable row level security;
alter table public.shipping_transactions enable row level security;

drop policy if exists "commerce_audit_logs_select" on public.commerce_audit_logs;
create policy "commerce_audit_logs_select"
  on public.commerce_audit_logs for select
  using (user_id = auth.uid() or actor_id = auth.uid() or public.is_admin());

drop policy if exists "escrow_events_select" on public.escrow_events;
create policy "escrow_events_select"
  on public.escrow_events for select
  using (seller_id = auth.uid() or public.is_admin());

drop policy if exists "refund_events_select" on public.refund_events;
create policy "refund_events_select"
  on public.refund_events for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "shipping_reserve_select" on public.shipping_reserve;
create policy "shipping_reserve_select"
  on public.shipping_reserve for select
  using (seller_id = auth.uid() or public.is_admin());

drop policy if exists "shipping_transactions_select" on public.shipping_transactions;
create policy "shipping_transactions_select"
  on public.shipping_transactions for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Grants (Data API): authenticated may SELECT (RLS-gated); service_role full.
-- ---------------------------------------------------------------------------
grant select on public.commerce_audit_logs to authenticated;
grant select on public.escrow_events to authenticated;
grant select on public.refund_events to authenticated;
grant select on public.shipping_reserve to authenticated;
grant select on public.shipping_transactions to authenticated;

grant all on public.commerce_audit_logs to service_role;
grant all on public.escrow_events to service_role;
grant all on public.refund_events to service_role;
grant all on public.shipping_reserve to service_role;
grant all on public.shipping_transactions to service_role;
