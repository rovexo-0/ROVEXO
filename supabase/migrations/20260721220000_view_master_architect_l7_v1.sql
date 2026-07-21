-- ROVEXO v1.0 — View Master Architect Level 7 (Galaxy QA contract)
-- Owner first open may count once (unique viewer_key / 24h).
-- Refresh / re-login / multi-tab same viewer → +0 extra.
-- Admin / super_admin never count. Unpublished blocked. Anti-spam 60/hour.

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
  v_status text;
  v_recent int;
  v_hour_count int;
  v_role public.user_role;
begin
  if product_slug is null or length(trim(product_slug)) = 0 then
    return false;
  end if;

  if p_viewer_key is null or length(trim(p_viewer_key)) < 8 then
    return false;
  end if;

  -- Staff protection — admin / super_admin never count
  if p_viewer_user_id is not null then
    select role into v_role
    from public.profiles
    where id = p_viewer_user_id
    limit 1;

    if v_role in ('admin'::public.user_role, 'super_admin'::public.user_role) then
      return false;
    end if;
  end if;

  select id, status
    into v_product_id, v_status
  from public.products
  where slug = product_slug
  limit 1;

  if v_product_id is null then
    return false;
  end if;

  if v_status is distinct from 'published' then
    return false;
  end if;

  -- Unique viewer window — refresh / multi-tab / re-login = 0 extra
  select count(*)::int into v_recent
  from public.product_view_events
  where product_id = v_product_id
    and viewer_key = p_viewer_key
    and created_at > now() - interval '24 hours';

  if v_recent > 0 then
    return false;
  end if;

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

grant execute on function public.record_unique_product_view(text, text, uuid) to anon, authenticated;

comment on function public.record_unique_product_view(text, text, uuid) is
  'ROVEXO v1.0 — unique viewer_key / 24h; staff blocked; unpublished blocked; anti-spam 60/hour; Galaxy QA';
