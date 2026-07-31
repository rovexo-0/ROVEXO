-- ROVEXO Sendcloud Webhook Idempotency v1.0
-- Atomic claim table: identical deliveries process EXACTLY ONCE.
-- Race-safe via UNIQUE(webhook_event_id) + insert-first claim.

create table if not exists public.sendcloud_webhook_events (
  webhook_event_id text primary key,
  tracking_number text,
  order_id uuid,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload_hash text,
  source text not null default 'sendcloud'
    check (source = 'sendcloud'),
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'processing'
    check (status in ('processing', 'completed', 'failed'))
);

alter table public.sendcloud_webhook_events enable row level security;

revoke all on table public.sendcloud_webhook_events from anon, authenticated;
grant all on table public.sendcloud_webhook_events to service_role;

create index if not exists sendcloud_webhook_events_processed_at_idx
  on public.sendcloud_webhook_events (processed_at desc);

create index if not exists sendcloud_webhook_events_order_id_idx
  on public.sendcloud_webhook_events (order_id)
  where order_id is not null;

create index if not exists sendcloud_webhook_events_tracking_number_idx
  on public.sendcloud_webhook_events (tracking_number)
  where tracking_number is not null;

comment on table public.sendcloud_webhook_events is
  'Sendcloud Webhook Idempotency v1.0 — durable delivery claims. Service role only. UNIQUE webhook_event_id.';

comment on column public.sendcloud_webhook_events.webhook_event_id is
  'Official composite: {parcel.id}:{status.id}:{timestamp} (Sendcloud has no dedicated event UUID).';
