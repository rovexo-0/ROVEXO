-- ROVEXO INVENTORY ENGINE v1.0 — enum + reserved flag
-- Absolute Law: published → reserved → sold → finished
-- product_status MUST contain (do not remove existing):
--   draft | published | reserved | paused | sold | deleted
-- Must commit before RPC migration uses 'reserved'.

alter type public.product_status add value if not exists 'draft';
alter type public.product_status add value if not exists 'published';
alter type public.product_status add value if not exists 'reserved';
alter type public.product_status add value if not exists 'paused';
alter type public.product_status add value if not exists 'sold';
alter type public.product_status add value if not exists 'deleted';

alter table public.products
  add column if not exists reserved boolean not null default false;

comment on column public.products.reserved is
  'Inventory Engine v1.0: true while status=reserved (Buy Now lock). Cleared on release or mark sold.';

create index if not exists products_reserved_true_idx
  on public.products (id)
  where reserved = true;
