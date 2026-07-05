-- Hotfix: account_status was added to profiles but never included in the
-- column-level SELECT grant from prelaunch_security. Queries like
-- `.select("account_status, role")` failed silently, breaking auth context.

grant select (account_status) on table public.profiles to anon, authenticated;

-- Unified account: personal (buyer) accounts can publish listings without a
-- separate seller identity. Extend insert policies accordingly.
drop policy if exists "products_insert_seller" on public.products;
create policy "products_insert_seller"
  on public.products for insert
  with check (
    seller_id = auth.uid()
    and public.current_user_role() in ('buyer', 'seller', 'business', 'admin', 'super_admin')
  );

drop policy if exists "products_storage_insert_seller" on storage.objects;
create policy "products_storage_insert_seller"
  on storage.objects for insert
  with check (
    bucket_id = 'products'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.current_user_role() in ('buyer', 'seller', 'business', 'admin', 'super_admin')
  );

drop policy if exists "product_images_insert" on public.product_images;
create policy "product_images_insert"
  on public.product_images for insert
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_id
        and p.seller_id = auth.uid()
        and public.current_user_role() in ('buyer', 'seller', 'business', 'admin', 'super_admin')
    )
  );
