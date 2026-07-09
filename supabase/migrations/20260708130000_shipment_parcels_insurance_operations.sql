-- Parcel insurance and independent parcel-level operations (return, claim, lost, damaged)

alter table public.shipment_parcels
  add column if not exists insurance_enabled boolean not null default false,
  add column if not exists insurance_value_gbp numeric(10, 2),
  add column if not exists parcel_operation text;

alter table public.shipment_parcels
  drop constraint if exists shipment_parcels_operation_check;

alter table public.shipment_parcels
  add constraint shipment_parcels_operation_check
  check (parcel_operation is null or parcel_operation in ('return', 'claim', 'lost', 'damaged'));
