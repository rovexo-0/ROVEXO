-- Conversation Hub / Orders must still read sold listings for parties.
-- Marketplace feeds continue to filter status = published only in app queries.

drop policy if exists "products_select_published" on public.products;
create policy "products_select_published"
  on public.products for select
  using (
    status in (
      'published'::public.product_status,
      'reserved'::public.product_status
    )
    or seller_id = auth.uid()
    or public.is_admin()
    or (
      status = 'sold'::public.product_status
      and exists (
        select 1
        from public.conversations c
        where c.product_id = products.id
          and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
      )
    )
    or (
      status = 'sold'::public.product_status
      and exists (
        select 1
        from public.orders o
        where o.buyer_id = auth.uid()
          and exists (
            select 1
            from public.order_items oi
            where oi.order_id = o.id
              and oi.product_id = products.id
          )
      )
    )
  );

comment on policy "products_select_published" on public.products is
  'Published/reserved public; seller/admin all; sold readable by conversation/order parties.';
