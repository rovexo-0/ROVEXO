-- Phase 2.1: Seller Listings production support

-- ---------------------------------------------------------------------------
-- product_images: thumbnail support
-- ---------------------------------------------------------------------------
alter table public.product_images
  add column if not exists thumbnail_url text;

-- ---------------------------------------------------------------------------
-- Brand helper (bypass admin-only RLS for sellers)
-- ---------------------------------------------------------------------------
create or replace function public.find_or_create_brand(brand_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_id uuid;
begin
  v_slug := left(
    trim(both '-' from regexp_replace(lower(trim(brand_name)), '[^a-z0-9]+', '-', 'g')),
    60
  );

  select id into v_id from public.brands where slug = v_slug;

  if v_id is not null then
    return v_id;
  end if;

  insert into public.brands (name, slug)
  values (trim(brand_name), v_slug)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.find_or_create_brand(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Increment product views (public read)
-- ---------------------------------------------------------------------------
create or replace function public.increment_product_views(product_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set views = views + 1
  where slug = product_slug
    and status = 'published';
end;
$$;

grant execute on function public.increment_product_views(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Sync product likes from saved_items count
-- ---------------------------------------------------------------------------
create or replace function public.sync_product_likes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid;
  v_count integer;
begin
  v_product_id := coalesce(new.product_id, old.product_id);

  select count(*) into v_count
  from public.saved_items
  where product_id = v_product_id;

  update public.products
  set likes = v_count
  where id = v_product_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists saved_items_sync_likes on public.saved_items;
create trigger saved_items_sync_likes
  after insert or delete on public.saved_items
  for each row execute function public.sync_product_likes();

-- ---------------------------------------------------------------------------
-- Sync seller listing_count
-- ---------------------------------------------------------------------------
create or replace function public.sync_seller_listing_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_count integer;
begin
  v_seller_id := coalesce(new.seller_id, old.seller_id);

  select count(*) into v_count
  from public.products
  where seller_id = v_seller_id
    and status in ('published', 'paused', 'draft');

  update public.seller_profiles
  set listing_count = v_count
  where id = v_seller_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists products_sync_seller_listing_count on public.products;
create trigger products_sync_seller_listing_count
  after insert or update or delete on public.products
  for each row execute function public.sync_seller_listing_count();

-- ---------------------------------------------------------------------------
-- Allow sellers to read own products regardless of status
-- (existing policies cover this; ensure sold/deleted visible to owner)
-- ---------------------------------------------------------------------------
drop policy if exists "products_select_published" on public.products;
create policy "products_select_published"
  on public.products for select
  using (
    status = 'published'
    or seller_id = auth.uid()
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- Brands: allow authenticated users to insert via function only (already security definer)
-- Add select for upsert visibility
-- ---------------------------------------------------------------------------
