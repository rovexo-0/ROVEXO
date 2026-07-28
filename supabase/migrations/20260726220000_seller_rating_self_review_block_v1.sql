-- ROVEXO Seller Rating System v1.0 — self-review + invalid rating hard block
-- In-place harden of create_order_review (no second rating system).
-- Social Follow remains permanently removed (social-system-removal-v1).

create or replace function public.create_order_review(
  p_order_id uuid,
  p_reviewer_id uuid,
  p_rating integer,
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_product_id uuid;
  v_review_id uuid;
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.buyer_id is distinct from p_reviewer_id then
    raise exception 'Only the buyer can review this order';
  end if;

  -- Absolute: never allow self-rating (buyer === seller).
  if v_order.buyer_id is not distinct from v_order.seller_id then
    raise exception 'Self-review is not allowed';
  end if;

  if v_order.status <> 'completed' then
    raise exception 'Order must be completed before reviewing';
  end if;

  if exists (select 1 from public.reviews where order_id = p_order_id) then
    raise exception 'Review already submitted for this order';
  end if;

  select oi.product_id into v_product_id
  from public.order_items oi
  where oi.order_id = p_order_id
  limit 1;

  insert into public.reviews (
    order_id,
    reviewer_id,
    reviewee_id,
    product_id,
    rating,
    comment
  )
  values (
    p_order_id,
    p_reviewer_id,
    v_order.seller_id,
    v_product_id,
    p_rating,
    nullif(trim(p_comment), '')
  )
  returning id into v_review_id;

  return v_review_id;
end;
$$;

revoke all on function public.create_order_review(uuid, uuid, integer, text) from public;
grant execute on function public.create_order_review(uuid, uuid, integer, text) to service_role;

comment on function public.create_order_review(uuid, uuid, integer, text) is
  'Seller Rating v1.0 — completed-order buyer review; blocks duplicates + self-review; rating 1–5.';
