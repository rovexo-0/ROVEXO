-- Sell flow v1.0: per-listing parcel size for automatic shipping labels and
-- courier pricing. Additive and nullable so existing listings are unaffected.
alter table public.products
  add column if not exists parcel_size text;

do $do$ begin
  alter table public.products
    add constraint products_parcel_size_check
    check (parcel_size is null or parcel_size in ('small', 'medium', 'large', 'xl'));
exception when duplicate_object then null;
end $do$;
