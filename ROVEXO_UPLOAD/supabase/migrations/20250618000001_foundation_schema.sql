-- ROVEXO Foundation Schema
-- Run via Supabase CLI: supabase db push
-- Or paste into Supabase SQL Editor
-- Idempotent: safe to re-run when partially applied.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $do$ begin
  create type public.user_role as enum ('buyer', 'seller', 'business', 'admin');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.product_status as enum ('draft', 'published', 'paused', 'sold', 'deleted');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.order_status as enum (
    'awaiting_payment',
    'awaiting_shipment',
    'shipped',
    'delivered',
    'issue_open',
    'completed',
    'cancelled'
  );
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.offer_status as enum ('pending', 'accepted', 'rejected', 'expired', 'cancelled');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.wallet_tx_status as enum ('completed', 'pending', 'failed', 'refunded');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.wallet_tx_type as enum ('sale', 'withdrawal', 'fee', 'refund');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.notification_type as enum (
    'message', 'order', 'offer', 'review', 'saved_item_sold', 'price_reduced', 'system'
  );
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.message_kind as enum ('text', 'photo', 'emoji');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.message_status as enum ('sent', 'delivered', 'read');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.sender_role as enum ('buyer', 'seller');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.withdraw_provider as enum ('bank_account', 'stripe_connect');
exception when duplicate_object then null;
end $do$;

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  full_name text not null,
  email text not null,
  avatar_url text,
  role public.user_role not null default 'buyer',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_length check (char_length(username) >= 3),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]+$')
);

create unique index if not exists profiles_username_lower_idx on public.profiles (lower(username));
create index if not exists profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------------
-- seller_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.seller_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  bio text,
  rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  follower_count integer not null default 0,
  listing_count integer not null default 0,
  sales_count integer not null default 0,
  vacation_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- business_accounts
-- ---------------------------------------------------------------------------
create table if not exists public.business_accounts (
  id uuid primary key references public.profiles (id) on delete cascade,
  business_name text not null,
  tax_id text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- brands
-- ---------------------------------------------------------------------------
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists brands_slug_idx on public.brands (slug);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  parent_id uuid references public.categories (id) on delete cascade,
  path_label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (slug, parent_id)
);

create index if not exists categories_parent_id_idx on public.categories (parent_id);
create index if not exists categories_slug_idx on public.categories (slug);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete restrict,
  slug text not null unique,
  title text not null,
  description text not null default '',
  brand_id uuid references public.brands (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  color text,
  size text,
  condition text not null,
  price numeric(12, 2) not null check (price > 0),
  original_price numeric(12, 2) check (original_price is null or original_price >= 0),
  status public.product_status not null default 'draft',
  accept_offers boolean not null default true,
  stock integer not null default 1 check (stock >= 0),
  sku text,
  low_stock_alert integer not null default 5 check (low_stock_alert >= 0),
  views integer not null default 0,
  likes integer not null default 0,
  rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  sections text[] not null default '{}',
  delivery_carriers text[] not null default array['Royal Mail', 'Evri', 'DPD', 'InPost'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_seller_id_idx on public.products (seller_id);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_category_id_idx on public.products (category_id);
create index if not exists products_created_at_idx on public.products (created_at desc);
create index if not exists products_sections_gin_idx on public.products using gin (sections);

create extension if not exists pg_trgm;
create index if not exists products_title_trgm_idx on public.products using gin (title gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  storage_path text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- shipping_addresses
-- ---------------------------------------------------------------------------
create table if not exists public.shipping_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  recipient_name text not null,
  address_line text not null,
  address_line_2 text,
  city text,
  postcode text not null,
  country text not null default 'Ireland',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipping_addresses_user_id_idx on public.shipping_addresses (user_id);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  buyer_id uuid not null references public.profiles (id) on delete restrict,
  seller_id uuid not null references public.profiles (id) on delete restrict,
  status public.order_status not null default 'awaiting_payment',
  delivery_carrier text not null default 'Royal Mail',
  tracking_number text,
  item_price numeric(12, 2) not null,
  protected_fee numeric(12, 2) not null default 0,
  delivery_fee numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  shipping_address_id uuid references public.shipping_addresses (id) on delete set null,
  disputes_disabled boolean not null default false,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists orders_buyer_id_idx on public.orders (buyer_id, created_at desc);
create index if not exists orders_seller_id_idx on public.orders (seller_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  title text not null,
  slug text not null,
  price numeric(12, 2) not null,
  image_url text not null,
  condition text not null,
  quantity integer not null default 1 check (quantity > 0)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- offers
-- ---------------------------------------------------------------------------
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  message text,
  status public.offer_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists offers_product_id_idx on public.offers (product_id);
create index if not exists offers_buyer_id_idx on public.offers (buyer_id);
create index if not exists offers_seller_id_idx on public.offers (seller_id);

-- ---------------------------------------------------------------------------
-- saved_items
-- ---------------------------------------------------------------------------
create table if not exists public.saved_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  saved_at timestamptz not null default now(),
  last_viewed_at timestamptz,
  primary key (user_id, product_id)
);

create index if not exists saved_items_user_id_idx on public.saved_items (user_id, saved_at desc);

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  last_message text not null default '',
  last_message_at timestamptz not null default now(),
  buyer_unread_count integer not null default 0,
  seller_unread_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, buyer_id, seller_id)
);

create index if not exists conversations_buyer_id_idx on public.conversations (buyer_id, last_message_at desc);
create index if not exists conversations_seller_id_idx on public.conversations (seller_id, last_message_at desc);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  sender_role public.sender_role not null,
  kind public.message_kind not null default 'text',
  content text not null,
  status public.message_status not null default 'sent',
  sent_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id, sent_at);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  subtitle text not null default '',
  href text not null default '/notifications',
  read boolean not null default false,
  avatar_url text,
  avatar_name text,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read = false;

-- ---------------------------------------------------------------------------
-- notification_settings
-- ---------------------------------------------------------------------------
create table if not exists public.notification_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  push_enabled boolean not null default true,
  messages boolean not null default true,
  orders boolean not null default true,
  offers boolean not null default true,
  reviews boolean not null default true,
  system boolean not null default true,
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time not null default '22:00',
  quiet_hours_end time not null default '08:00',
  sound boolean not null default true,
  vibration boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- wallets
-- ---------------------------------------------------------------------------
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  available_balance numeric(12, 2) not null default 0 check (available_balance >= 0),
  pending_balance numeric(12, 2) not null default 0 check (pending_balance >= 0),
  pending_available_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wallets_user_id_idx on public.wallets (user_id);

-- ---------------------------------------------------------------------------
-- wallet_transactions
-- ---------------------------------------------------------------------------
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  order_number text,
  product_title text not null,
  product_image_url text,
  amount numeric(12, 2) not null,
  status public.wallet_tx_status not null default 'pending',
  type public.wallet_tx_type not null,
  description text,
  fee_amount numeric(12, 2),
  withdraw_method_label text,
  payout_available_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists wallet_transactions_wallet_id_idx on public.wallet_transactions (wallet_id, created_at desc);
create index if not exists wallet_transactions_user_id_idx on public.wallet_transactions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- withdraw_methods
-- ---------------------------------------------------------------------------
create table if not exists public.withdraw_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider public.withdraw_provider not null,
  label text not null,
  last_digits text not null,
  connected boolean not null default false,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists withdraw_methods_user_id_idx on public.withdraw_methods (user_id);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_reviewee_id_idx on public.reviews (reviewee_id);

-- ---------------------------------------------------------------------------
-- user_settings
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  push_notifications boolean not null default true,
  email_notifications boolean not null default true,
  dark_mode boolean not null default false,
  language text not null default 'English',
  currency text not null default 'EUR (€)',
  vacation_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Role helper functions (require public.profiles)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists seller_profiles_updated_at on public.seller_profiles;
create trigger seller_profiles_updated_at before update on public.seller_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists business_accounts_updated_at on public.business_accounts;
create trigger business_accounts_updated_at before update on public.business_accounts
  for each row execute function public.set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists shipping_addresses_updated_at on public.shipping_addresses;
create trigger shipping_addresses_updated_at before update on public.shipping_addresses
  for each row execute function public.set_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists offers_updated_at on public.offers;
create trigger offers_updated_at before update on public.offers
  for each row execute function public.set_updated_at();

drop trigger if exists wallets_updated_at on public.wallets;
create trigger wallets_updated_at before update on public.wallets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth trigger: create profile + wallet + settings on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_full_name text;
  v_role public.user_role;
begin
  v_username := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    split_part(new.email, '@', 1)
  );
  v_username := lower(regexp_replace(v_username, '[^a-z0-9_]', '', 'g'));
  if char_length(v_username) < 3 then
    v_username := 'user' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  v_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'fullName'), ''),
    v_username
  );

  v_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.user_role,
    'buyer'
  );

  insert into public.profiles (id, username, full_name, email, role)
  values (new.id, v_username, v_full_name, new.email, v_role);

  insert into public.wallets (user_id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);
  insert into public.notification_settings (user_id) values (new.id);

  if v_role in ('seller', 'business') then
    insert into public.seller_profiles (id) values (new.id)
    on conflict (id) do nothing;
  end if;

  if v_role = 'business' then
    insert into public.business_accounts (id, business_name)
    values (
      new.id,
      coalesce(nullif(trim(new.raw_user_meta_data->>'business_name'), ''), v_full_name)
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Order number generator
-- ---------------------------------------------------------------------------
create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
begin
  return 'RVX' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
end;
$$;

-- ---------------------------------------------------------------------------
-- Slug generator helper
-- ---------------------------------------------------------------------------
create or replace function public.slugify(value text)
returns text
language sql
immutable
as $$
  select left(
    trim(both '-' from regexp_replace(lower(trim(value)), '[^a-z0-9]+', '-', 'g')),
    60
  );
$$;
