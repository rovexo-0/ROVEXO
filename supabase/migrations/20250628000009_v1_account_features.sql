-- ROVEXO v1.0 account features: profile extensions, appearance, addresses, payment methods

alter table public.profiles
  add column if not exists phone text,
  add column if not exists stripe_customer_id text;

alter table public.user_settings
  add column if not exists locale_code text not null default 'en-IE',
  add column if not exists appearance_mode text not null default 'system';

do $do$ begin
  alter table public.user_settings
    add constraint user_settings_appearance_mode_check
    check (appearance_mode in ('light', 'dark', 'system'));
exception when duplicate_object then null;
end $do$;

alter table public.shipping_addresses
  add column if not exists address_type text not null default 'shipping';

do $do$ begin
  alter table public.shipping_addresses
    add constraint shipping_addresses_type_check
    check (address_type in ('shipping', 'billing'));
exception when duplicate_object then null;
end $do$;

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
  constraint payment_methods_stripe_id_unique unique (stripe_payment_method_id)
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
