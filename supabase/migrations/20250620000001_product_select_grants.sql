-- PRODUCT_SELECT read path (lib/products/repository.ts)
--
-- Embeds:
--   products (*)
--   profiles:seller_id ( full_name, avatar_url, verified )
--   product_images ( url, sort_order, is_primary )
--   brands ( name )
--
-- RLS SELECT policies for these tables already exist in
-- 20250618000002_rls_policies.sql (and products policy refresh in
-- 20250619000001_seller_listings.sql). This migration adds the table-level
-- GRANTs required by PostgREST for anon/authenticated/service_role access.
--
-- Live verification (anon REST, 2026-06-19): brands returned 42501 without
-- SELECT grant; products, profiles, and product_images succeeded once grants
-- were present.

-- ---------------------------------------------------------------------------
-- products
-- Policy: products_select_published (status = 'published' OR owner OR admin)
-- ---------------------------------------------------------------------------
grant select on table public.products to anon;
grant select on table public.products to authenticated;
grant all on table public.products to service_role;

-- ---------------------------------------------------------------------------
-- profiles (embedded via products.seller_id → profiles.id)
-- Policy: profiles_select_public (using true)
-- ---------------------------------------------------------------------------
grant select on table public.profiles to anon;
grant select on table public.profiles to authenticated;
grant all on table public.profiles to service_role;

-- ---------------------------------------------------------------------------
-- brands (embedded via products.brand_id → brands.id)
-- Policy: brands_select_all (using true)
-- ---------------------------------------------------------------------------
grant select on table public.brands to anon;
grant select on table public.brands to authenticated;
grant all on table public.brands to service_role;

-- ---------------------------------------------------------------------------
-- product_images (embedded via product_images.product_id → products.id)
-- Policy: product_images_select (published product OR owner OR admin)
-- GRANTs were partially added in 20250618000002_rls_policies.sql; repeat
-- here so a fresh apply of this migration alone is sufficient.
-- ---------------------------------------------------------------------------
grant select on table public.product_images to anon;
grant select, insert, update, delete on table public.product_images to authenticated;
grant all on table public.product_images to service_role;
