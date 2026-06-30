-- Production catalog query indexes for category browse and description search.
-- Safe additive migration: no business logic changes.

-- Category browse: filter by category + newest sort
create index if not exists products_published_category_created_idx
  on public.products (category_id, created_at desc)
  where status = 'published';

-- Description search (trigram) for marketplace search hot path
create index if not exists products_description_trgm_idx
  on public.products using gin (description gin_trgm_ops);
