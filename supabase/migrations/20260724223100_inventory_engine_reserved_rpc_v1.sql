-- ROVEXO INVENTORY ENGINE v1.0 — Absolute Law FINAL PASS
-- Reserve: status=reserved, reserved=true, stock UNCHANGED (LOCK ONLY)
-- Release: reserved → published, reserved=false, stock UNCHANGED
-- Mark sold: PAYMENT SUCCESS ONLY → sold, reserved=false, stock = stock - quantity

create or replace function public.reserve_product_inventory(
  p_product_id uuid,
  p_quantity integer default 1
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock integer;
  v_status public.product_status;
begin
  if p_quantity is null or p_quantity <= 0 then
    return false;
  end if;

  select stock, status into v_stock, v_status
  from public.products
  where id = p_product_id
  for update;

  if not found then
    return false;
  end if;

  -- Only published + in-stock listings may be reserved.
  if v_status is distinct from 'published'::public.product_status then
    return false;
  end if;

  if v_stock is null or v_stock < p_quantity then
    return false;
  end if;

  update public.products
  set
    status = 'reserved'::public.product_status,
    reserved = true,
    updated_at = now()
  where id = p_product_id;

  return true;
end;
$$;

create or replace function public.release_product_inventory(
  p_product_id uuid,
  p_quantity integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.product_status;
  v_reserved boolean;
begin
  if p_product_id is null then
    return;
  end if;

  -- p_quantity kept for call-site compatibility; release never changes stock.
  if p_quantity is null or p_quantity <= 0 then
    return;
  end if;

  select status, reserved into v_status, v_reserved
  from public.products
  where id = p_product_id
  for update;

  if not found then
    return;
  end if;

  -- Absolute Law: reserved → published (stock unchanged)
  if v_status = 'reserved'::public.product_status
     or v_reserved is true then
    update public.products
    set
      status = 'published'::public.product_status,
      reserved = false,
      updated_at = now()
    where id = p_product_id;
    return;
  end if;

  -- One-time legacy unlock: old reserve set sold + decremented stock.
  if v_status = 'sold'::public.product_status then
    update public.products
    set
      stock = stock + p_quantity,
      status = 'published'::public.product_status,
      reserved = false,
      updated_at = now()
    where id = p_product_id;
  end if;
end;
$$;

-- Drop single-arg overload so PostgREST binds Absolute Law signature.
drop function if exists public.mark_product_sold(uuid);

create or replace function public.mark_product_sold(
  p_product_id uuid,
  p_quantity integer default 1
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.product_status;
  v_stock integer;
  v_reserved boolean;
begin
  if p_product_id is null then
    return false;
  end if;

  if p_quantity is null or p_quantity <= 0 then
    return false;
  end if;

  select status, stock, reserved into v_status, v_stock, v_reserved
  from public.products
  where id = p_product_id
  for update;

  if not found then
    return false;
  end if;

  -- Already sold = idempotent success
  if v_status = 'sold'::public.product_status then
    return true;
  end if;

  -- PAYMENT SUCCESS ONLY: reserved (preferred) or published (legacy)
  if v_status not in (
    'reserved'::public.product_status,
    'published'::public.product_status
  ) and v_reserved is distinct from true then
    return false;
  end if;

  if v_stock is null or v_stock < p_quantity then
    return false;
  end if;

  update public.products
  set
    status = 'sold'::public.product_status,
    reserved = false,
    stock = stock - p_quantity,
    updated_at = now()
  where id = p_product_id;

  return true;
end;
$$;

revoke all on function public.reserve_product_inventory(uuid, integer) from public;
revoke all on function public.release_product_inventory(uuid, integer) from public;
revoke all on function public.mark_product_sold(uuid, integer) from public;

grant execute on function public.reserve_product_inventory(uuid, integer) to service_role;
grant execute on function public.release_product_inventory(uuid, integer) to service_role;
grant execute on function public.mark_product_sold(uuid, integer) to service_role;

-- Checkout must read reserved listings (Buy Now → RESERVED → /checkout).
-- Marketplace feeds still filter status = published only.
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
  );
