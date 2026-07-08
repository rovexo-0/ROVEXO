-- Canonical multi-parcel shipping: Order → Shipment (shipping_records) → Parcels → Label

create table if not exists public.shipment_parcels (
  id uuid primary key default gen_random_uuid(),
  shipping_record_id uuid not null references public.shipping_records (id) on delete cascade,
  parcel_number integer not null,
  total_parcels integer not null default 1,
  weight_kg numeric(8, 3),
  length_cm numeric(8, 2),
  width_cm numeric(8, 2),
  height_cm numeric(8, 2),
  carrier text,
  shipping_service text,
  tracking_number text,
  tracking_url text,
  status public.shipping_status_v1 not null default 'preparing',
  product_item_ids jsonb not null default '[]'::jsonb,
  estimated_delivery_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipment_parcels_number_positive check (parcel_number > 0),
  constraint shipment_parcels_total_positive check (total_parcels > 0),
  unique (shipping_record_id, parcel_number)
);

create index if not exists shipment_parcels_record_idx
  on public.shipment_parcels (shipping_record_id, parcel_number);

drop trigger if exists shipment_parcels_updated_at on public.shipment_parcels;
create trigger shipment_parcels_updated_at before update on public.shipment_parcels
  for each row execute function public.set_updated_at();

alter table public.shipment_parcels enable row level security;

drop policy if exists "shipment_parcels_parties_select" on public.shipment_parcels;
create policy "shipment_parcels_parties_select"
  on public.shipment_parcels for select
  using (
    exists (
      select 1
      from public.shipping_records sr
      join public.orders o on o.id = sr.order_id
      where sr.id = shipment_parcels.shipping_record_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

-- Allow multiple labels: one label per parcel (not per shipment)
alter table public.shipping_labels_v1
  drop constraint if exists shipping_labels_v1_shipping_record_id_key;

alter table public.shipping_labels_v1
  add column if not exists shipment_parcel_id uuid references public.shipment_parcels (id) on delete cascade,
  add column if not exists parcel_number integer,
  add column if not exists total_parcels integer,
  add column if not exists tracking_url text,
  add column if not exists shipping_service text,
  add column if not exists estimated_delivery_at timestamptz,
  add column if not exists weight_kg numeric(8, 3),
  add column if not exists length_cm numeric(8, 2),
  add column if not exists width_cm numeric(8, 2),
  add column if not exists height_cm numeric(8, 2);

create unique index if not exists shipping_labels_v1_parcel_uidx
  on public.shipping_labels_v1 (shipment_parcel_id)
  where shipment_parcel_id is not null;

create unique index if not exists shipping_labels_v1_record_parcel_number_uidx
  on public.shipping_labels_v1 (shipping_record_id, parcel_number)
  where parcel_number is not null;

-- Backfill: one parcel per existing shipment that has a label or tracking data
insert into public.shipment_parcels (
  shipping_record_id,
  parcel_number,
  total_parcels,
  carrier,
  tracking_number,
  tracking_url,
  status,
  weight_kg,
  length_cm,
  width_cm,
  height_cm,
  created_at,
  updated_at
)
select
  sr.id,
  1,
  1,
  coalesce(sr.carrier, sl.carrier),
  coalesce(sl.tracking_number, sr.tracking_number),
  sr.tracking_url,
  sr.status,
  sr.weight_kg,
  sr.length_cm,
  sr.width_cm,
  sr.height_cm,
  sr.created_at,
  sr.updated_at
from public.shipping_records sr
left join public.shipping_labels_v1 sl on sl.shipping_record_id = sr.id
where not exists (
  select 1 from public.shipment_parcels sp where sp.shipping_record_id = sr.id
)
on conflict do nothing;

-- Link existing labels to backfilled parcels
update public.shipping_labels_v1 sl
set
  shipment_parcel_id = sp.id,
  parcel_number = sp.parcel_number,
  total_parcels = sp.total_parcels
from public.shipment_parcels sp
where sl.shipping_record_id = sp.shipping_record_id
  and sp.parcel_number = 1
  and sl.shipment_parcel_id is null;
