-- Seller listing city/town/village only (no street, postcode, or coordinates).
alter table public.products
  add column if not exists location_city text;

-- Backfill from Stage 1 description markers, if any exist.
update public.products
set location_city = (regexp_match(description, '<!--rovexo-city:([^>]+)-->'))[1]
where location_city is null
  and description ~ '<!--rovexo-city:[^>]+-->';
