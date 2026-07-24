-- ROVEXO View Engine Master Spec v1.0
-- Owner click → +1 when not listing seller.
-- Keeps: listing seller = 0 · unpublished = 0 · unique 24h · anti-spam 60/hour.
-- Removes: blanket admin/super_admin = 0 (blocked Owner visual proof on localhost:3000).
-- Does not edit SQL #1–#4 files.

create or replace function public.record_unique_product_view(
  product_slug text,
  p_viewer_key text,
  p_viewer_user_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid;
  v_seller_id uuid;
  v_status text;
  v_recent int;
  v_hour_count int;
begin
  if product_slug is null or length(trim(product_slug)) = 0 then
    return false;
  end if;

  if p_viewer_key is null or length(trim(p_viewer_key)) < 8 then
    return false;
  end if;

  select id, seller_id, status
    into v_product_id, v_seller_id, v_status
  from public.products
  where slug = product_slug
  limit 1;

  if v_product_id is null then
    return false;
  end if;

  if v_status is distinct from 'published' then
    return false;
  end if;

  -- SELLER = 0 — listing seller never inflates own views
  if p_viewer_user_id is not null and v_seller_id is not null
     and p_viewer_user_id = v_seller_id then
    return false;
  end if;

  -- Unique viewer window — refresh / multi-tab / re-login = +0 extra
  select count(*)::int into v_recent
  from public.product_view_events
  where product_id = v_product_id
    and viewer_key = p_viewer_key
    and created_at > now() - interval '24 hours';

  if v_recent > 0 then
    return false;
  end if;

  -- Anti-spam / anti-bot flood across catalogue
  select count(*)::int into v_hour_count
  from public.product_view_events
  where viewer_key = p_viewer_key
    and created_at > now() - interval '1 hour';

  if v_hour_count >= 60 then
    return false;
  end if;

  insert into public.product_view_events (product_id, viewer_key, viewer_user_id)
  values (v_product_id, p_viewer_key, p_viewer_user_id);

  update public.products
  set views = coalesce(views, 0) + 1
  where id = v_product_id;

  return true;
end;
$$;

comment on function public.record_unique_product_view(text, text, uuid) is
  'ROVEXO View Engine Master Spec v1.0 — seller=0 · unpublished=0 · unique 24h · anti-spam 60/hour · Owner/admin may count when not seller';
