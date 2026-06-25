-- ROVEXO v1.0 production account completion (idempotent, safe for existing data)

-- profiles extensions (v1 baseline)
alter table public.profiles
  add column if not exists phone text,
  add column if not exists stripe_customer_id text;

create index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- user_settings extensions
alter table public.user_settings
  add column if not exists locale_code text not null default 'en-IE',
  add column if not exists appearance_mode text not null default 'system',
  add column if not exists timezone text not null default 'Europe/Dublin',
  add column if not exists profile_visibility text not null default 'public',
  add column if not exists marketing_emails boolean not null default false,
  add column if not exists show_activity_status boolean not null default true;

do $do$ begin
  alter table public.user_settings
    add constraint user_settings_appearance_mode_check
    check (appearance_mode in ('light', 'dark', 'system'));
exception when duplicate_object then null;
end $do$;

do $do$ begin
  alter table public.user_settings
    add constraint user_settings_profile_visibility_check
    check (profile_visibility in ('public', 'members_only', 'private'));
exception when duplicate_object then null;
end $do$;

-- shipping_addresses extensions
alter table public.shipping_addresses
  add column if not exists address_type text not null default 'shipping';

do $do$ begin
  alter table public.shipping_addresses
    add constraint shipping_addresses_type_check
    check (address_type in ('shipping', 'billing'));
exception when duplicate_object then null;
end $do$;

create index if not exists shipping_addresses_user_type_idx
  on public.shipping_addresses (user_id, address_type);

create unique index if not exists shipping_addresses_one_default_per_type_idx
  on public.shipping_addresses (user_id, address_type)
  where is_default = true;

-- payment_methods
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stripe_payment_method_id text not null,
  brand text not null default 'card',
  last4 text not null,
  exp_month integer not null,
  exp_year integer not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_methods_stripe_id_unique unique (stripe_payment_method_id),
  constraint payment_methods_exp_month_check check (exp_month >= 1 and exp_month <= 12),
  constraint payment_methods_exp_year_check check (exp_year >= 2000 and exp_year <= 2100)
);

create index if not exists payment_methods_user_id_idx on public.payment_methods (user_id);

drop trigger if exists payment_methods_updated_at on public.payment_methods;
create trigger payment_methods_updated_at before update on public.payment_methods
  for each row execute function public.set_updated_at();

alter table public.payment_methods enable row level security;

drop policy if exists "payment_methods_select_own" on public.payment_methods;
create policy "payment_methods_select_own"
  on public.payment_methods for select
  using (auth.uid() = user_id);

drop policy if exists "payment_methods_insert_own" on public.payment_methods;
create policy "payment_methods_insert_own"
  on public.payment_methods for insert
  with check (auth.uid() = user_id);

drop policy if exists "payment_methods_update_own" on public.payment_methods;
create policy "payment_methods_update_own"
  on public.payment_methods for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "payment_methods_delete_own" on public.payment_methods;
create policy "payment_methods_delete_own"
  on public.payment_methods for delete
  using (auth.uid() = user_id);

-- buyer_preferences
create table if not exists public.buyer_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  save_search_alerts boolean not null default true,
  order_updates_push boolean not null default true,
  order_updates_email boolean not null default true,
  show_recommendations boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists buyer_preferences_updated_at on public.buyer_preferences;
create trigger buyer_preferences_updated_at before update on public.buyer_preferences
  for each row execute function public.set_updated_at();

alter table public.buyer_preferences enable row level security;

drop policy if exists "buyer_preferences_select_own" on public.buyer_preferences;
create policy "buyer_preferences_select_own"
  on public.buyer_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "buyer_preferences_insert_own" on public.buyer_preferences;
create policy "buyer_preferences_insert_own"
  on public.buyer_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "buyer_preferences_update_own" on public.buyer_preferences;
create policy "buyer_preferences_update_own"
  on public.buyer_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- seller_shipping_settings
create table if not exists public.seller_shipping_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  handling_time_days integer not null default 1,
  free_shipping_threshold numeric(12, 2),
  default_carrier text not null default 'Royal Mail',
  ships_to text not null default 'Ireland',
  local_pickup_enabled boolean not null default false,
  international_shipping_enabled boolean not null default false,
  return_policy_days integer not null default 14,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_shipping_handling_time_check
    check (handling_time_days >= 0 and handling_time_days <= 30),
  constraint seller_shipping_return_policy_check
    check (return_policy_days >= 0 and return_policy_days <= 90)
);

drop trigger if exists seller_shipping_settings_updated_at on public.seller_shipping_settings;
create trigger seller_shipping_settings_updated_at before update on public.seller_shipping_settings
  for each row execute function public.set_updated_at();

alter table public.seller_shipping_settings enable row level security;

drop policy if exists "seller_shipping_settings_select_own" on public.seller_shipping_settings;
create policy "seller_shipping_settings_select_own"
  on public.seller_shipping_settings for select
  using (auth.uid() = user_id);

drop policy if exists "seller_shipping_settings_insert_own" on public.seller_shipping_settings;
create policy "seller_shipping_settings_insert_own"
  on public.seller_shipping_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "seller_shipping_settings_update_own" on public.seller_shipping_settings;
create policy "seller_shipping_settings_update_own"
  on public.seller_shipping_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- blocked users
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  blocked_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_blocks_not_self check (user_id <> blocked_user_id),
  constraint user_blocks_unique unique (user_id, blocked_user_id)
);

create index if not exists user_blocks_user_id_idx on public.user_blocks (user_id);
create index if not exists user_blocks_blocked_user_id_idx on public.user_blocks (blocked_user_id);

alter table public.user_blocks enable row level security;

drop policy if exists "user_blocks_select_own" on public.user_blocks;
create policy "user_blocks_select_own"
  on public.user_blocks for select
  using (auth.uid() = user_id);

drop policy if exists "user_blocks_insert_own" on public.user_blocks;
create policy "user_blocks_insert_own"
  on public.user_blocks for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_blocks_delete_own" on public.user_blocks;
create policy "user_blocks_delete_own"
  on public.user_blocks for delete
  using (auth.uid() = user_id);
