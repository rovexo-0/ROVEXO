-- Production blockers: refunds, payouts, email retries, review aggregation

alter table public.orders
  add column if not exists stripe_refund_id text,
  add column if not exists refunded_at timestamptz;

create unique index if not exists orders_stripe_refund_id_uidx
  on public.orders (stripe_refund_id)
  where stripe_refund_id is not null;

alter table public.wallet_transactions
  add column if not exists stripe_transfer_id text,
  add column if not exists stripe_payout_id text;

create unique index if not exists wallet_transactions_stripe_transfer_uidx
  on public.wallet_transactions (stripe_transfer_id)
  where stripe_transfer_id is not null;

alter table public.email_outbox
  add column if not exists retry_count integer not null default 0,
  add column if not exists last_error text,
  add column if not exists next_retry_at timestamptz;

create index if not exists email_outbox_retry_idx
  on public.email_outbox (status, next_retry_at, created_at);

-- Aggregate seller ratings when reviews change
create or replace function public.refresh_seller_rating(p_seller_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric(3, 2);
  v_count integer;
begin
  select coalesce(avg(rating)::numeric(3, 2), 0), count(*)
  into v_avg, v_count
  from public.reviews
  where reviewee_id = p_seller_id;

  update public.seller_profiles
  set
    rating = v_avg,
    review_count = v_count,
    updated_at = now()
  where id = p_seller_id;
end;
$$;

create or replace function public.refresh_seller_rating_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_seller_rating(old.reviewee_id);
    return old;
  end if;

  perform public.refresh_seller_rating(new.reviewee_id);
  return new;
end;
$$;

drop trigger if exists reviews_refresh_seller_rating on public.reviews;
create trigger reviews_refresh_seller_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_seller_rating_trigger();

-- Secure review creation: completed order, buyer only, one review per order
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

-- Prevent direct client inserts bypassing order verification RPC
drop policy if exists "reviews_insert_reviewer" on public.reviews;
