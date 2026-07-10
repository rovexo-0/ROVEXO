-- Buyer order cancellation metadata + Sendcloud parcel reference for label voiding.

alter table public.orders
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists refunded_amount numeric(12, 2);

alter table public.shipping_labels_v1
  add column if not exists provider_parcel_id text;

create index if not exists orders_cancelled_at_idx
  on public.orders (cancelled_at desc)
  where cancelled_at is not null;
