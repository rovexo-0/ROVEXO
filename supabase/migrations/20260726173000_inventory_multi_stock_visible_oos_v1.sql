-- Inventory multi-stock: payment success decrements stock and keeps listing visible.
-- When remaining stock > 0 → published (still for sale).
-- When remaining stock = 0 → published + stock 0 (Out of Stock UI; Buy Now disabled).
-- Restock via seller edit (stock > 0) immediately restores Buy Now.

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

  -- Already fully sold with zero stock = idempotent success
  if v_status = 'sold'::public.product_status and coalesce(v_stock, 0) <= 0 then
    return true;
  end if;

  if v_status not in (
    'reserved'::public.product_status,
    'published'::public.product_status
  ) and v_reserved is distinct from true then
    return false;
  end if;

  if v_stock is null or v_stock < p_quantity then
    return false;
  end if;

  v_remaining := v_stock - p_quantity;

  update public.products
  set
    -- Keep listing visible: published at any remaining stock (including 0 = Out of Stock).
    status = 'published'::public.product_status,
    reserved = false,
    stock = v_remaining,
    updated_at = now()
  where id = p_product_id;

  return true;
end;
$$;
