-- ROVEXO MASTER_CHECKOUT_ARCHITECTURE v1.0
-- Checkout Session = ONLY temporary object before payment.
-- TTL Absolute Law: 120 seconds (reserved max 120s).
-- Orders / Transactions are NOT created here.

create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete restrict,
  listing_id uuid not null references public.products (id) on delete restrict,
  product_slug text not null,
  currency text not null check (char_length(currency) = 3),
  item_price numeric(12, 2) not null check (item_price > 0),
  platform_fee numeric(12, 2) not null check (platform_fee >= 0),
  shipping numeric(12, 2) not null check (shipping >= 0),
  total numeric(12, 2) not null check (total > 0),
  offer_id uuid null,
  conversation_id uuid null,
  stripe_payment_intent_id text null,
  stripe_checkout_session_id text null,
  order_id uuid null references public.orders (id) on delete set null,
  status text not null
    check (status in ('open', 'expired', 'cancelled', 'paid')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz null
);

create index if not exists checkout_sessions_buyer_open_idx
  on public.checkout_sessions (buyer_id, status)
  where status = 'open';

create index if not exists checkout_sessions_listing_open_idx
  on public.checkout_sessions (listing_id, status)
  where status = 'open';

create index if not exists checkout_sessions_expires_open_idx
  on public.checkout_sessions (expires_at)
  where status = 'open';

comment on table public.checkout_sessions is
  'Master Checkout Architecture v1.0 — sole pre-payment temporary object. TTL 120s Absolute Law.';

alter table public.checkout_sessions enable row level security;

drop policy if exists "checkout_sessions_select_own" on public.checkout_sessions;
create policy "checkout_sessions_select_own"
  on public.checkout_sessions for select
  using (buyer_id = auth.uid() or public.is_admin());

-- Writes via service_role only (Buy Now / Payment / Webhook engines).
revoke all on table public.checkout_sessions from public;
grant select on table public.checkout_sessions to authenticated;
grant all on table public.checkout_sessions to service_role;
