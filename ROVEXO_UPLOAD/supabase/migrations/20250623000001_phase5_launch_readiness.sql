-- Phase 5: Help Centre support, seller tax registration, notification extensions

do $do$ begin
  create type public.support_category as enum (
    'account',
    'buying',
    'selling',
    'payments',
    'delivery',
    'chat',
    'technical',
    'business',
    'pro_seller',
    'appeal_moderation',
    'report_user',
    'other'
  );
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.support_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.seller_registration_type as enum (
    'personal',
    'pro_seller',
    'business_sole_trader',
    'business_company'
  );
exception when duplicate_object then null;
end $do$;

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  ticket_number text not null unique,
  category public.support_category not null,
  subject text not null,
  description text not null,
  attachment_urls text[] not null default '{}',
  status public.support_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_user_idx on public.support_tickets (user_id, created_at desc);
create index if not exists support_tickets_status_idx on public.support_tickets (status, created_at desc);

create table if not exists public.seller_tax_profiles (
  seller_id uuid primary key references public.seller_profiles (id) on delete cascade,
  registration_type public.seller_registration_type not null,
  full_name text,
  address_line1 text,
  address_line2 text,
  city text,
  postcode text,
  country text not null default 'GB',
  email text,
  phone text,
  nino text,
  utr text,
  company_name text,
  company_number text,
  registered_address text,
  vat_number text,
  director_name text,
  stripe_connect_completed boolean not null default false,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_tickets enable row level security;
alter table public.seller_tax_profiles enable row level security;

drop policy if exists "support_tickets_insert_own" on public.support_tickets;
create policy "support_tickets_insert_own"
  on public.support_tickets for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "support_tickets_select_own" on public.support_tickets;
create policy "support_tickets_select_own"
  on public.support_tickets for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "seller_tax_profiles_self" on public.seller_tax_profiles;
create policy "seller_tax_profiles_self"
  on public.seller_tax_profiles for all
  to authenticated
  using (auth.uid() = seller_id or public.is_admin())
  with check (auth.uid() = seller_id or public.is_admin());

drop trigger if exists support_tickets_updated_at on public.support_tickets;
create trigger support_tickets_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();

drop trigger if exists seller_tax_profiles_updated_at on public.seller_tax_profiles;
create trigger seller_tax_profiles_updated_at before update on public.seller_tax_profiles
  for each row execute function public.set_updated_at();

do $do$ begin
  alter type public.notification_type add value if not exists 'payment';
exception when duplicate_object then null;
end $do$;

do $do$ begin
  alter type public.notification_type add value if not exists 'follower';
exception when duplicate_object then null;
end $do$;

do $do$ begin
  alter type public.notification_type add value if not exists 'moderation';
exception when duplicate_object then null;
end $do$;

do $do$ begin
  alter type public.notification_type add value if not exists 'promotion_expired';
exception when duplicate_object then null;
end $do$;

create or replace function public.generate_support_ticket_number()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  candidate := 'SUP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  return candidate;
end;
$$;
