-- ROVEXO Stripe E2E Canonical — P0 Individual/Business financial separation
-- Additive / backwards-compatible. Does NOT delete Stripe IDs or financial rows.

-- ---------------------------------------------------------------------------
-- 1. Seller context on orders + checkout_sessions (immutable at creation)
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists seller_context text;

alter table public.checkout_sessions
  add column if not exists seller_context text;

-- Historical rows default to individual (safe fail-closed)
update public.orders
set seller_context = 'individual'
where seller_context is null;

update public.checkout_sessions
set seller_context = 'individual'
where seller_context is null;

alter table public.orders
  alter column seller_context set default 'individual';

alter table public.checkout_sessions
  alter column seller_context set default 'individual';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_seller_context_check'
  ) then
    alter table public.orders
      add constraint orders_seller_context_check
      check (seller_context in ('individual', 'business'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'checkout_sessions_seller_context_check'
  ) then
    alter table public.checkout_sessions
      add constraint checkout_sessions_seller_context_check
      check (seller_context in ('individual', 'business'));
  end if;
end $$;

alter table public.orders
  alter column seller_context set not null;

alter table public.checkout_sessions
  alter column seller_context set not null;

comment on column public.orders.seller_context is
  'Immutable seller financial context at order creation: individual | business.';

-- ---------------------------------------------------------------------------
-- 2. Dual Stripe Connect account IDs (preserve legacy column)
-- ---------------------------------------------------------------------------
alter table public.seller_profiles
  add column if not exists stripe_connect_account_id_individual text,
  add column if not exists stripe_connect_account_id_business text,
  add column if not exists stripe_connect_charges_enabled_individual boolean,
  add column if not exists stripe_connect_payouts_enabled_individual boolean,
  add column if not exists stripe_connect_details_submitted_individual boolean,
  add column if not exists stripe_connect_charges_enabled_business boolean,
  add column if not exists stripe_connect_payouts_enabled_business boolean,
  add column if not exists stripe_connect_details_submitted_business boolean;

-- Backfill: existing Connect → individual context
update public.seller_profiles
set stripe_connect_account_id_individual = stripe_connect_account_id
where stripe_connect_account_id is not null
  and stripe_connect_account_id_individual is null;

create unique index if not exists seller_profiles_stripe_connect_individual_uidx
  on public.seller_profiles (stripe_connect_account_id_individual)
  where stripe_connect_account_id_individual is not null;

create unique index if not exists seller_profiles_stripe_connect_business_uidx
  on public.seller_profiles (stripe_connect_account_id_business)
  where stripe_connect_account_id_business is not null;

-- ---------------------------------------------------------------------------
-- 3. Wallet context separation (one row per user + context)
-- ---------------------------------------------------------------------------
alter table public.wallets
  add column if not exists wallet_context text;

update public.wallets
set wallet_context = 'individual'
where wallet_context is null;

alter table public.wallets
  alter column wallet_context set default 'individual';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'wallets_wallet_context_check'
  ) then
    alter table public.wallets
      add constraint wallets_wallet_context_check
      check (wallet_context in ('individual', 'business'));
  end if;
end $$;

alter table public.wallets
  alter column wallet_context set not null;

-- Drop one-wallet-per-user unique (column unique or named constraint)
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.wallets'::regclass
    and contype = 'u'
    and pg_get_constraintdef(oid) ilike '%user_id%'
    and pg_get_constraintdef(oid) not ilike '%wallet_context%'
  limit 1;
  if cname is not null then
    execute format('alter table public.wallets drop constraint %I', cname);
  end if;
exception when others then
  -- Fallback: try common auto names
  begin
    alter table public.wallets drop constraint if exists wallets_user_id_key;
  exception when others then null;
  end;
end $$;

create unique index if not exists wallets_user_id_context_uidx
  on public.wallets (user_id, wallet_context);

-- ---------------------------------------------------------------------------
-- 4. Wallet transaction context (denormalized for release/withdraw filters)
-- ---------------------------------------------------------------------------
alter table public.wallet_transactions
  add column if not exists seller_context text;

update public.wallet_transactions wt
set seller_context = coalesce(
  (select o.seller_context from public.orders o where o.order_number = wt.order_number limit 1),
  'individual'
)
where wt.seller_context is null;

alter table public.wallet_transactions
  alter column seller_context set default 'individual';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'wallet_transactions_seller_context_check'
  ) then
    alter table public.wallet_transactions
      add constraint wallet_transactions_seller_context_check
      check (seller_context is null or seller_context in ('individual', 'business'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Lost parcel guarantee ledger (idempotent, netting-ready)
-- ---------------------------------------------------------------------------
create table if not exists public.lost_parcel_guarantee_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  seller_id uuid not null references public.profiles (id),
  buyer_id uuid references public.profiles (id),
  seller_context text not null default 'individual'
    check (seller_context in ('individual', 'business')),
  guarantee_amount numeric(12, 2) not null check (guarantee_amount >= 0 and guarantee_amount <= 100),
  carrier_compensation_amount numeric(12, 2) not null default 0 check (carrier_compensation_amount >= 0),
  net_amount numeric(12, 2) not null check (net_amount >= 0),
  currency text not null default 'GBP',
  status text not null default 'completed'
    check (status in ('pending', 'completed', 'reversed')),
  idempotency_key text not null,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (idempotency_key),
  unique (order_id)
);

create index if not exists lost_parcel_guarantee_events_seller_idx
  on public.lost_parcel_guarantee_events (seller_id, created_at desc);

-- Service-role / server only (financial guarantee ledger).
-- Matches stripe_webhook_events posture: RLS enabled, no anon/authenticated grants,
-- no unrestricted client policies. App writes via createAdminClient only.
alter table public.lost_parcel_guarantee_events enable row level security;

revoke all on table public.lost_parcel_guarantee_events from anon, authenticated;
grant all on table public.lost_parcel_guarantee_events to service_role;

comment on table public.lost_parcel_guarantee_events is
  'Lost parcel seller guarantee ≤ £100 net of carrier. Service role only — no client RLS policies.';

-- ---------------------------------------------------------------------------
-- 6. Cancel claim (single-effect concurrency)
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists cancel_claim_key text;

create unique index if not exists orders_cancel_claim_key_uidx
  on public.orders (cancel_claim_key)
  where cancel_claim_key is not null;

-- ---------------------------------------------------------------------------
-- 7. Webhook processing: allow "ignored" for unhandled events
-- ---------------------------------------------------------------------------
alter table public.stripe_webhook_events
  add column if not exists handling_result text;

comment on column public.stripe_webhook_events.handling_result is
  'handled | ignored_unhandled_type | failed — unhandled must not imply economic success.';
