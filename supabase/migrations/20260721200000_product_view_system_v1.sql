-- ROVEXO v1.0 — Product View System (Vinted + eBay style)
-- DATABASE SSOT · 24h unique view · owner = 0 · anti-spam · no localStorage

create table if not exists public.product_view_events (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  viewer_key text not null,
  viewer_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists product_view_events_dedup_idx
  on public.product_view_events (product_id, viewer_key, created_at desc);

create index if not exists product_view_events_viewer_hour_idx
  on public.product_view_events (viewer_key, created_at desc);

alter table public.product_view_events enable row level security;

-- No direct client access — security definer RPC only
drop policy if exists "product_view_events_deny_all" on public.product_view_events;
create policy "product_view_events_deny_all"
  on public.product_view_events
  for all
  using (false)
  with check (false);

/**
 * Record at most ONE view per viewer_key + product within 24 hours.
 * Owner (seller) viewing own listing → false (0 view).
 * Anti-spam: max 60 unique product views / viewer_key / hour.
 * Returns true when products.views was incremented.
 */
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

  -- OWNER PROTECTION — seller does not inflate own views
  if p_viewer_user_id is not null and v_seller_id is not null
     and p_viewer_user_id = v_seller_id then
    return false;
  end if;

  -- 24h unique view (1000 refresh = 1 view)
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

grant execute on function public.record_unique_product_view(text, text, uuid) to anon, authenticated;

-- Legacy RPC → fail closed (must use record_unique_product_view)
create or replace function public.increment_product_views(product_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Intentionally no-op: unauthenticated blanket +1 is forbidden.
  -- Callers must use record_unique_product_view with viewer_key.
  return;
end;
$$;

grant execute on function public.increment_product_views(text) to anon, authenticated;

comment on table public.product_view_events is
  'ROVEXO v1.0 view SSOT — 24h unique per viewer_key · owner excluded · anti-spam';
