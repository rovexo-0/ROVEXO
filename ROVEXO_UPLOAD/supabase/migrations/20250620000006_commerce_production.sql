-- Commerce production: cart, order payments, inventory RPCs, email outbox, Connect

-- ---------------------------------------------------------------------------
-- Order payment columns
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists stripe_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists reserved_until timestamptz;

create unique index if not exists orders_stripe_session_id_uidx
  on public.orders (stripe_session_id)
  where stripe_session_id is not null;

create index if not exists orders_awaiting_payment_expiry_idx
  on public.orders (reserved_until)
  where status = 'awaiting_payment';

-- ---------------------------------------------------------------------------
-- Cart items
-- ---------------------------------------------------------------------------
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists cart_items_user_id_idx on public.cart_items (user_id, updated_at desc);

alter table public.cart_items enable row level security;

drop policy if exists "cart_items_select_own" on public.cart_items;
create policy "cart_items_select_own"
  on public.cart_items for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "cart_items_insert_own" on public.cart_items;
create policy "cart_items_insert_own"
  on public.cart_items for insert
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "cart_items_update_own" on public.cart_items;
create policy "cart_items_update_own"
  on public.cart_items for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "cart_items_delete_own" on public.cart_items;
create policy "cart_items_delete_own"
  on public.cart_items for delete
  using (user_id = auth.uid() or public.is_admin());

drop trigger if exists cart_items_updated_at on public.cart_items;
create trigger cart_items_updated_at before update on public.cart_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Email outbox (queued transactional emails)
-- ---------------------------------------------------------------------------
create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  subject text not null,
  body_text text not null,
  template text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists email_outbox_status_idx on public.email_outbox (status, created_at);

alter table public.email_outbox enable row level security;

drop policy if exists "email_outbox_admin" on public.email_outbox;
create policy "email_outbox_admin"
  on public.email_outbox for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Stripe Connect account id on seller profiles
-- ---------------------------------------------------------------------------
alter table public.seller_profiles
  add column if not exists stripe_connect_account_id text;

create unique index if not exists seller_profiles_stripe_connect_uidx
  on public.seller_profiles (stripe_connect_account_id)
  where stripe_connect_account_id is not null;

-- ---------------------------------------------------------------------------
-- Inventory RPCs (atomic reserve / release)
-- ---------------------------------------------------------------------------
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
begin
  if p_quantity is null or p_quantity <= 0 then
    return false;
  end if;

  select stock into v_stock
  from public.products
  where id = p_product_id
    and status = 'published'
  for update;

  if not found or v_stock < p_quantity then
    return false;
  end if;

  update public.products
  set
    stock = stock - p_quantity,
    status = case when stock - p_quantity <= 0 then 'sold'::public.product_status else status end,
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
begin
  if p_product_id is null or p_quantity is null or p_quantity <= 0 then
    return;
  end if;

  update public.products
  set
    stock = stock + p_quantity,
    status = case
      when status = 'sold'::public.product_status then 'published'::public.product_status
      else status
    end,
    updated_at = now()
  where id = p_product_id;
end;
$$;

revoke all on function public.reserve_product_inventory(uuid, integer) from public;
revoke all on function public.release_product_inventory(uuid, integer) from public;
grant execute on function public.reserve_product_inventory(uuid, integer) to service_role;
grant execute on function public.release_product_inventory(uuid, integer) to service_role;
