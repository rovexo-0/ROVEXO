-- ROVEXO Reviews Engine v1.0 — dual review slots + one public reply
-- Does NOT modify Rating Engine lock file. Evolves reviews table in place.
-- Max 2 reviews per order (buyer→seller + seller→buyer). Unique (order_id, reviewer_id).

-- 1) Allow two reviews per order
alter table public.reviews drop constraint if exists reviews_order_id_key;

do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.reviews'::regclass
    and contype = 'u'
    and pg_get_constraintdef(oid) ilike '%order_id%'
    and pg_get_constraintdef(oid) not ilike '%reviewer_id%'
  limit 1;
  if cname is not null then
    execute format('alter table public.reviews drop constraint %I', cname);
  end if;
end $$;

create unique index if not exists reviews_order_reviewer_unique
  on public.reviews (order_id, reviewer_id);

create index if not exists reviews_order_id_idx
  on public.reviews (order_id, created_at desc);

-- 2) Reply + edit + verified purchase columns
alter table public.reviews
  add column if not exists verified_purchase boolean not null default true,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists reply_text text,
  add column if not exists reply_at timestamptz,
  add column if not exists reply_author_id uuid references public.profiles (id) on delete set null;

comment on column public.reviews.reviewee_id is
  'Reviewed user (reviewed_user_id). Buyer reviews seller OR seller reviews buyer.';
comment on column public.reviews.verified_purchase is
  'Always true for order-backed reviews. Users cannot clear this.';

-- One public reply only: once reply_text is set it stays (app enforces; DB blocks overwrite by different author)
alter table public.reviews drop constraint if exists reviews_reply_author_is_reviewee;
alter table public.reviews
  add constraint reviews_reply_author_is_reviewee
  check (
    reply_author_id is null
    or reply_author_id = reviewee_id
  );

-- 3) Dual-slot create_order_review (buyer OR seller participant)
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
  v_reviewee_id uuid;
  v_count integer;
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

  if v_order.buyer_id is not distinct from v_order.seller_id then
    raise exception 'Self-review is not allowed';
  end if;

  if p_reviewer_id is not distinct from v_order.buyer_id then
    v_reviewee_id := v_order.seller_id;
  elsif p_reviewer_id is not distinct from v_order.seller_id then
    v_reviewee_id := v_order.buyer_id;
  else
    raise exception 'Only order participants can review';
  end if;

  if v_order.status <> 'completed' then
    raise exception 'Order must be completed before reviewing';
  end if;

  if v_order.paid_at is null then
    raise exception 'Payment must be completed before reviewing';
  end if;

  if v_order.delivered_at is null and v_order.completed_at is null then
    raise exception 'Delivery must be completed before reviewing';
  end if;

  if v_order.refunded_at is not null
     or coalesce(v_order.refund_status, '') = 'completed' then
    raise exception 'Refunded orders cannot be reviewed';
  end if;

  if exists (
    select 1
    from public.reviews
    where order_id = p_order_id
      and reviewer_id = p_reviewer_id
  ) then
    raise exception 'Review already submitted for this order';
  end if;

  select count(*)::integer into v_count
  from public.reviews
  where order_id = p_order_id;

  if v_count >= 2 then
    raise exception 'Maximum two reviews per order';
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
    comment,
    verified_purchase
  )
  values (
    p_order_id,
    p_reviewer_id,
    v_reviewee_id,
    v_product_id,
    p_rating,
    nullif(trim(p_comment), ''),
    true
  )
  returning id into v_review_id;

  return v_review_id;
end;
$$;

revoke all on function public.create_order_review(uuid, uuid, integer, text) from public;
grant execute on function public.create_order_review(uuid, uuid, integer, text) to service_role;

comment on function public.create_order_review(uuid, uuid, integer, text) is
  'Reviews Engine v1.0 — buyer→seller or seller→buyer; max 2/order; Verified Purchase; blocks duplicates + self-review.';

notify pgrst, 'reload schema';
