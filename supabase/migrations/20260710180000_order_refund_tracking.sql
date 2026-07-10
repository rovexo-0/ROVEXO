-- Buyer refund lifecycle tracking for order cancellation refunds.

alter table public.orders
  add column if not exists refund_status text,
  add column if not exists refund_reference text,
  add column if not exists refund_created_at timestamptz,
  add column if not exists refund_completed_at timestamptz,
  add column if not exists refund_failure_reason text,
  add column if not exists refund_payment_method text,
  add column if not exists refund_estimated_arrival timestamptz,
  add column if not exists refund_last_updated timestamptz;

create index if not exists orders_refund_status_idx
  on public.orders (refund_status)
  where refund_status is not null;
