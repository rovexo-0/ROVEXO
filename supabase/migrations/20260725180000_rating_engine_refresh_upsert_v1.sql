-- ROVEXO Absolute Blood Law — RUN #1 DEFECT #001
-- Rating Engine: seller upsert (unified accounts) + product rating aggregation.
-- In-place fix of refresh_seller_rating SSOT — no second rating system.

create or replace function public.refresh_product_rating(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric(3, 2);
  v_count integer;
begin
  if p_product_id is null then
    return;
  end if;

  select coalesce(avg(rating)::numeric(3, 2), 0), count(*)
  into v_avg, v_count
  from public.reviews
  where product_id = p_product_id;

  update public.products
  set
    rating = v_avg,
    review_count = v_count,
    updated_at = now()
  where id = p_product_id;
end;
$$;

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
  if p_seller_id is null then
    return;
  end if;

  select coalesce(avg(rating)::numeric(3, 2), 0), count(*)
  into v_avg, v_count
  from public.reviews
  where reviewee_id = p_seller_id;

  -- Unified accounts may not have a seller_profiles row — upsert, never silent no-op.
  insert into public.seller_profiles (id, rating, review_count, updated_at)
  values (p_seller_id, v_avg, v_count, now())
  on conflict (id) do update
  set
    rating = excluded.rating,
    review_count = excluded.review_count,
    updated_at = now();
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
    perform public.refresh_product_rating(old.product_id);
    return old;
  end if;

  perform public.refresh_seller_rating(new.reviewee_id);
  perform public.refresh_product_rating(new.product_id);

  if tg_op = 'UPDATE'
     and old.product_id is distinct from new.product_id
     and old.product_id is not null then
    perform public.refresh_product_rating(old.product_id);
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_refresh_seller_rating on public.reviews;
create trigger reviews_refresh_seller_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_seller_rating_trigger();

-- One-shot backfill for existing reviews (seller + listing).
do $$
declare
  r record;
begin
  for r in
    select distinct reviewee_id as seller_id
    from public.reviews
    where reviewee_id is not null
  loop
    perform public.refresh_seller_rating(r.seller_id);
  end loop;

  for r in
    select distinct product_id
    from public.reviews
    where product_id is not null
  loop
    perform public.refresh_product_rating(r.product_id);
  end loop;
end;
$$;
