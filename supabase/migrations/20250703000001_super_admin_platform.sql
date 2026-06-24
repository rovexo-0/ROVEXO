-- ROVEXO v1.0 Super Admin: role, singleton enforcement, platform settings, account controls

do $do$ begin
  alter type public.user_role add value if not exists 'super_admin';
exception when duplicate_object then null;
end $do$;

alter table public.profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_reason text,
  add column if not exists deleted_at timestamptz;

do $do$ begin
  alter table public.profiles
    add constraint profiles_account_status_check
    check (account_status in ('active', 'suspended', 'deleted'));
exception when duplicate_object then null;
end $do$;

alter table public.seller_profiles
  add column if not exists listing_limit integer;

create table if not exists public.profile_entitlements (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  premium boolean not null default false,
  lifetime_premium boolean not null default false,
  company_verified boolean not null default false,
  promotion_credits integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.platform_settings (key, value)
values
  ('maintenance_mode', '{"enabled":false,"message":"ROVEXO is undergoing scheduled maintenance. Please check back shortly."}'::jsonb),
  ('feature_visibility', '{"auctions":false,"wholesale":true,"voiceSearch":false}'::jsonb),
  ('platform_announcement', '{"enabled":false,"title":"","body":"","href":""}'::jsonb)
on conflict (key) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super_admin'
  );
$$;

create or replace function public.enforce_single_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'super_admin'::public.user_role then
    if exists (
      select 1
      from public.profiles
      where role = 'super_admin'::public.user_role
        and id <> new.id
    ) then
      raise exception 'Only one Super Admin account is allowed on ROVEXO';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_enforce_single_super_admin on public.profiles;
create trigger profiles_enforce_single_super_admin
  before insert or update of role on public.profiles
  for each row execute function public.enforce_single_super_admin();

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public.is_super_admin() then
      raise exception 'Role changes require Super Admin privileges';
    end if;

    if new.role = 'admin'::public.user_role then
      raise exception 'Admin accounts are disabled. ROVEXO uses a single Super Admin account.';
    end if;
  end if;
  return new;
end;
$$;

alter table public.profile_entitlements enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists "profile_entitlements_super_admin" on public.profile_entitlements;
create policy "profile_entitlements_super_admin"
  on public.profile_entitlements for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "profile_entitlements_self_read" on public.profile_entitlements;
create policy "profile_entitlements_self_read"
  on public.profile_entitlements for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "platform_settings_super_admin" on public.platform_settings;
create policy "platform_settings_super_admin"
  on public.platform_settings for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select on public.platform_settings to authenticated;
grant select on public.profile_entitlements to authenticated;
