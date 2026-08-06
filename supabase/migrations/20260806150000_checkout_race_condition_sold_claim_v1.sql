-- COD SÂNGE P0 — Checkout Race Condition
-- Payment success claims inventory atomically.
-- stock remaining > 0 → stay published (multi-stock)
-- stock remaining = 0 → status = sold (marketplace hide)
-- Already sold / insufficient stock → false (second payer loses)

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
  v_remaining integer;
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

  -- Idempotent: already sold with zero stock
  if v_status = 'sold'::public.product_status and coalesce(v_stock, 0) <= 0 then
    return true;
  end if;

  -- Accept published (canonical) or reserved (legacy heal path during payment)
  if v_status = 'sold'::public.product_status then
    return false;
  end if;

  if v_status not in (
    'published'::public.product_status,
    'reserved'::public.product_status
  ) and v_reserved is distinct from true then
    return false;
  end if;

  if v_stock is null or v_stock < p_quantity then
    return false;
  end if;

  v_remaining := v_stock - p_quantity;

  update public.products
  set
    status = case
      when v_remaining <= 0 then 'sold'::public.product_status
      else 'published'::public.product_status
    end,
    reserved = false,
    stock = greatest(v_remaining, 0),
    updated_at = now()
  where id = p_product_id;

  return true;
end;
$$;

-- Rollback inventory claim if order creation / wallet debit fails after claim.
create or replace function public.restore_product_inventory_claim(
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
begin
  if p_product_id is null then
    return false;
  end if;

  if p_quantity is null or p_quantity <= 0 then
    return false;
  end if;

  select stock into v_stock
    from public.products
   where id = p_product_id
   for update;

  if not found then
    return false;
  end if;

  update public.products
  set
    status = 'published'::public.product_status,
    reserved = false,
    stock = coalesce(v_stock, 0) + p_quantity,
    updated_at = now()
  where id = p_product_id;

  return true;
end;
$$;

revoke all on function public.restore_product_inventory_claim(uuid, integer) from public;
grant execute on function public.restore_product_inventory_claim(uuid, integer) to service_role;

-- Orphan reserved heal is owned by CHECKOUT_SESSION_ENGINE_expireAll / destroy
-- (canonical release_product_inventory). No force UPDATE in this migration.
