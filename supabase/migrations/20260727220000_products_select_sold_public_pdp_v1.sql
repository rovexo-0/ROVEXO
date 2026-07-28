-- BLOOD III — Public SOLD Product Page
-- Sold listings must remain publicly readable (canonical SOLD PDP).
-- Marketplace feeds continue to filter status = published only in app queries.
-- Saved items must keep sold rows (never orphan-delete via RLS null join).

drop policy if exists "products_select_published" on public.products;
create policy "products_select_published"
  on public.products for select
  using (
    status in (
      'published'::public.product_status,
      'reserved'::public.product_status,
      'sold'::public.product_status
    )
    or seller_id = auth.uid()
    or public.is_admin()
  );

comment on policy "products_select_published" on public.products is
  'Published/reserved/sold public; seller/admin all. Feeds still filter published in app queries.';
