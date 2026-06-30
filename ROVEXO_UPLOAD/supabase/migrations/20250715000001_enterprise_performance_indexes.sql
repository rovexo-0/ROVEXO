-- Enterprise performance indexes for catalog, search, orders, and profile lookups.
-- Safe additive migration: no business logic changes.

-- Published catalog: default newest sort
create index if not exists products_published_created_idx
  on public.products (created_at desc)
  where status = 'published';

-- Published catalog: location filter + recency
create index if not exists products_published_location_city_idx
  on public.products (location_city, created_at desc)
  where status = 'published' and location_city is not null;

-- Published catalog: price sort
create index if not exists products_published_price_idx
  on public.products (price asc)
  where status = 'published';

-- Published catalog: popular / views sort
create index if not exists products_published_views_idx
  on public.products (views desc, created_at desc)
  where status = 'published';

-- Published catalog: in-stock filter
create index if not exists products_published_stock_idx
  on public.products (stock)
  where status = 'published' and stock > 0;

-- Orders: status dashboards and ops timelines
create index if not exists orders_status_created_idx
  on public.orders (status, created_at desc);

-- Profile search (marketplace search autocomplete)
create index if not exists profiles_full_name_trgm_idx
  on public.profiles using gin (full_name gin_trgm_ops);

create index if not exists profiles_username_trgm_idx
  on public.profiles using gin (username gin_trgm_ops);

-- Brand search (marketplace search autocomplete)
create index if not exists brands_name_trgm_idx
  on public.brands using gin (name gin_trgm_ops);
