-- ROVEXO Wallet Security Certification v1.0 (additive only — non-destructive)
-- Anti double-spend, webhook replay protection, bank column hardening,
-- withdraw payout rail indexes, locked balance bucket.

-- Durable Stripe webhook idempotency (replay / retry safe)
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now(),
  status text not null default 'completed'
    check (status in ('completed', 'failed', 'processing'))
);

alter table public.stripe_webhook_events enable row level security;

-- Service role only (no authenticated access)
revoke all on table public.stripe_webhook_events from anon, authenticated;
grant all on table public.stripe_webhook_events to service_role;

create index if not exists stripe_webhook_events_processed_at_idx
  on public.stripe_webhook_events (processed_at desc);

-- Idempotency key on wallet ledger rows
alter table public.wallet_transactions
  add column if not exists idempotency_key text;

create unique index if not exists wallet_transactions_idempotency_key_uidx
  on public.wallet_transactions (idempotency_key)
  where idempotency_key is not null;

-- One sale credit per seller order (blocks duplicate pending credits)
create unique index if not exists wallet_transactions_sale_order_uidx
  on public.wallet_transactions (user_id, order_number, type)
  where type = 'sale';

-- One completed refund ledger row per order description
create unique index if not exists wallet_transactions_refund_order_uidx
  on public.wallet_transactions (user_id, type, description)
  where type = 'refund' and description is not null;

-- Pending / failed withdrawal lookups (processing + rollback audits)
create index if not exists wallet_transactions_withdrawal_status_idx
  on public.wallet_transactions (user_id, status, created_at desc)
  where type = 'withdrawal';

-- Harden bank detail columns: authenticated may not read ciphertext/plaintext secrets.
-- App reads via service role only (getBankAccountForPayout).
revoke select (sort_code, account_number) on table public.withdraw_methods from authenticated, anon;
grant select (sort_code, account_number) on table public.withdraw_methods to service_role;
grant update (sort_code, account_number) on table public.withdraw_methods to service_role;
grant insert (sort_code, account_number) on table public.withdraw_methods to service_role;

-- Locked balance bucket (blocked funds — never shown as Available)
alter table public.wallets
  add column if not exists locked_balance numeric(12, 2) not null default 0
    check (locked_balance >= 0);

-- Comment contract for operators (payout metadata must include these keys)
comment on table public.stripe_webhook_events is
  'Wallet Security v1 — durable Stripe event claims. Service role only.';

comment on column public.wallet_transactions.idempotency_key is
  'Wallet Security v1 — unique withdraw/sale/refund idempotency key.';

comment on column public.wallets.locked_balance is
  'Wallet Security v1 — funds that cannot move (never Available).';
