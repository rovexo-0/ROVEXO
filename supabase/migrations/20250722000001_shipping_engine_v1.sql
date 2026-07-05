-- ROVEXO Shipping Engine v1.0 — canonical shipping record, label, tracking, pricing

do $do$ begin
  create type public.shipping_status_v1 as enum (
    'preparing',
    'collected',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'returned',
    'cancelled',
    'lost',
    'failed'
  );
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.parcel_tier_v1 as enum (
    'letter',
    'small_parcel',
    'medium_parcel',
    'large_parcel',
    'xl_parcel'
  );
exception when duplicate_object then null;
end $do$;

create table if not exists public.shipping_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  parcel_tier public.parcel_tier_v1 not null default 'medium_parcel',
  status public.shipping_status_v1 not null default 'preparing',
  carrier text,
  tracking_number text,
  weight_kg numeric(8, 3),
  length_cm numeric(8, 2),
  width_cm numeric(8, 2),
  height_cm numeric(8, 2),
  category_slug text,
  ai_recommended_tier public.parcel_tier_v1,
  manual_override_tier public.parcel_tier_v1,
  collection_address jsonb,
  delivery_address jsonb,
  selected_quote_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipping_records_order_idx on public.shipping_records (order_id);
create index if not exists shipping_records_status_idx on public.shipping_records (status, updated_at desc);

create table if not exists public.shipping_labels_v1 (
  id uuid primary key default gen_random_uuid(),
  shipping_record_id uuid not null unique references public.shipping_records (id) on delete cascade,
  tracking_number text,
  barcode text,
  qr_payload text,
  pdf_storage_path text,
  carrier text not null,
  label_status text not null default 'pending',
  internal_platform_fee_pence integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipping_tracking_events (
  id uuid primary key default gen_random_uuid(),
  shipping_record_id uuid not null references public.shipping_records (id) on delete cascade,
  status public.shipping_status_v1 not null,
  title text not null,
  description text,
  location text,
  occurred_at timestamptz not null,
  source text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists shipping_tracking_events_record_idx
  on public.shipping_tracking_events (shipping_record_id, occurred_at desc);

create table if not exists public.shipping_quotes (
  id uuid primary key default gen_random_uuid(),
  shipping_record_id uuid not null references public.shipping_records (id) on delete cascade,
  provider_id text not null,
  carrier text not null,
  service_name text not null,
  price_pence integer not null,
  currency text not null default 'GBP',
  estimated_days_min integer not null,
  estimated_days_max integer not null,
  recommended text,
  quote_payload jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists shipping_quotes_record_idx on public.shipping_quotes (shipping_record_id, created_at desc);

drop trigger if exists shipping_records_updated_at on public.shipping_records;
create trigger shipping_records_updated_at before update on public.shipping_records
  for each row execute function public.set_updated_at();

drop trigger if exists shipping_labels_v1_updated_at on public.shipping_labels_v1;
create trigger shipping_labels_v1_updated_at before update on public.shipping_labels_v1
  for each row execute function public.set_updated_at();

alter table public.shipping_records enable row level security;
alter table public.shipping_labels_v1 enable row level security;
alter table public.shipping_tracking_events enable row level security;
alter table public.shipping_quotes enable row level security;

drop policy if exists "shipping_records_parties_select" on public.shipping_records;
create policy "shipping_records_parties_select"
  on public.shipping_records for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = shipping_records.order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

drop policy if exists "shipping_records_seller_write" on public.shipping_records;
create policy "shipping_records_seller_write"
  on public.shipping_records for all
  using (
    exists (
      select 1 from public.orders o
      where o.id = shipping_records.order_id and o.seller_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.orders o
      where o.id = shipping_records.order_id and o.seller_id = auth.uid()
    )
  );

drop policy if exists "shipping_labels_parties_select" on public.shipping_labels_v1;
create policy "shipping_labels_parties_select"
  on public.shipping_labels_v1 for select
  using (
    exists (
      select 1 from public.shipping_records sr
      join public.orders o on o.id = sr.order_id
      where sr.id = shipping_labels_v1.shipping_record_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

drop policy if exists "shipping_tracking_events_parties_select" on public.shipping_tracking_events;
create policy "shipping_tracking_events_parties_select"
  on public.shipping_tracking_events for select
  using (
    exists (
      select 1 from public.shipping_records sr
      join public.orders o on o.id = sr.order_id
      where sr.id = shipping_tracking_events.shipping_record_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

drop policy if exists "shipping_quotes_parties_select" on public.shipping_quotes;
create policy "shipping_quotes_parties_select"
  on public.shipping_quotes for select
  using (
    exists (
      select 1 from public.shipping_records sr
      join public.orders o on o.id = sr.order_id
      where sr.id = shipping_quotes.shipping_record_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );
