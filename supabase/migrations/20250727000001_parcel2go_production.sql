-- Parcel2Go production integration for ROVEXO shipping engine.
-- Runs AFTER 20250722000001_shipping_engine_v1 (creates shipping_records/labels/quotes).
-- Additive + idempotent so existing shipping data is unaffected.

alter table public.shipping_records
  add column if not exists provider text not null default 'parcel2go',
  add column if not exists service_code text,
  add column if not exists parcel2go_order_id text,
  add column if not exists parcel2go_order_line_id text,
  add column if not exists parcel2go_order_line_hmac text,
  add column if not exists parcel2go_reference text,
  add column if not exists tracking_url text,
  add column if not exists shipping_price_pence integer,
  add column if not exists insurance_price_pence integer,
  -- PHASE 4: idempotency — one Parcel2Go shipment per order
  add column if not exists parcel2go_idempotency_key text,
  add column if not exists last_tracking_sync_at timestamptz;

alter table public.shipping_labels_v1
  add column if not exists provider text not null default 'parcel2go',
  add column if not exists label_url text,
  add column if not exists label_storage_path text,
  add column if not exists parcel2go_reference text;

alter table public.shipping_quotes
  add column if not exists service_code text,
  add column if not exists estimated_delivery_at timestamptz;

create index if not exists shipping_records_parcel2go_order_idx
  on public.shipping_records (parcel2go_order_id)
  where parcel2go_order_id is not null;

-- One Parcel2Go order per idempotency key (guards against duplicate create/pay)
create unique index if not exists shipping_records_parcel2go_idempotency_uidx
  on public.shipping_records (parcel2go_idempotency_key)
  where parcel2go_idempotency_key is not null;

-- PHASE 2: webhook event log with duplicate + replay protection
create table if not exists public.parcel2go_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  event_type text not null,
  parcel2go_order_id text,
  parcel2go_order_line_id text,
  tracking_number text,
  signature text,
  event_timestamp timestamptz,
  payload jsonb not null,
  correlation_id text,
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists parcel2go_webhook_events_order_idx
  on public.parcel2go_webhook_events (parcel2go_order_id, created_at desc);

-- Duplicate-event protection: the same signed body cannot be recorded twice
create unique index if not exists parcel2go_webhook_events_signature_uidx
  on public.parcel2go_webhook_events (signature)
  where signature is not null;

alter table public.parcel2go_webhook_events enable row level security;

-- PHASE 5: private storage bucket for purchased Parcel2Go label PDFs
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shipping-labels',
  'shipping-labels',
  false,
  10485760,
  array['application/pdf', 'image/png']
)
on conflict (id) do nothing;

do $do$ begin
  create policy "Shipping labels service role manage"
  on storage.objects for all to service_role
  using (bucket_id = 'shipping-labels')
  with check (bucket_id = 'shipping-labels');
exception when duplicate_object then null;
end $do$;
