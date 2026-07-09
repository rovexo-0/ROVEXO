-- Shipping provider fallback event log (Parcel2Go primary → Shippo fallback)

create table if not exists public.shipping_fallback_events (
  id uuid primary key default gen_random_uuid(),
  operation text not null check (operation in ('quote', 'label', 'tracking')),
  reason text not null,
  primary_provider text not null default 'parcel2go',
  fallback_provider text not null default 'shippo',
  order_id uuid references public.orders (id) on delete set null,
  parcel_id uuid references public.shipment_parcels (id) on delete set null,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists shipping_fallback_events_created_idx
  on public.shipping_fallback_events (created_at desc);

alter table public.shipping_fallback_events enable row level security;

-- Service role only — super-admin API uses admin client
drop policy if exists "shipping_fallback_events_service" on public.shipping_fallback_events;
create policy "shipping_fallback_events_service"
  on public.shipping_fallback_events for all
  using (false)
  with check (false);
