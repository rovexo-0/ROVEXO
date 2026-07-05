-- ROVEXO Super Admin — Staff Profile & Activity Audit v1.0

do $do$ begin
  create type public.staff_status as enum ('active', 'suspended', 'archived');
exception when duplicate_object then null;
end $do$;

create table if not exists public.staff_role_catalog (
  id text primary key,
  label text not null,
  description text,
  sort_order integer not null default 0
);

insert into public.staff_role_catalog (id, label, description, sort_order)
values
  ('administrator', 'Administrator', 'Full platform administration', 1),
  ('support', 'Support', 'Customer support operations', 2),
  ('marketplace_moderator', 'Marketplace Moderator', 'Listing and content moderation', 3),
  ('finance', 'Finance', 'Payments, refunds, and wallet operations', 4),
  ('shipping', 'Shipping', 'Logistics and fulfilment operations', 5),
  ('business', 'Business', 'Verified business account operations', 6),
  ('content_manager', 'Content Manager', 'CMS, homepage, and content publishing', 7)
on conflict (id) do update
set
  label = excluded.label,
  description = excluded.description,
  sort_order = excluded.sort_order;

create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  first_name text not null,
  last_name text not null,
  personal_email_encrypted text not null,
  personal_email_hash text not null,
  phone_encrypted text,
  phone_hash text,
  status public.staff_status not null default 'active',
  registered_at timestamptz not null default now(),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_profiles_status_idx on public.staff_profiles (status, registered_at desc);
create index if not exists staff_profiles_name_idx on public.staff_profiles (last_name, first_name);
create index if not exists staff_profiles_email_hash_idx on public.staff_profiles (personal_email_hash);
create index if not exists staff_profiles_phone_hash_idx on public.staff_profiles (phone_hash) where phone_hash is not null;
create index if not exists staff_profiles_last_login_idx on public.staff_profiles (last_login_at desc nulls last);

create table if not exists public.staff_member_roles (
  staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  role_id text not null references public.staff_role_catalog (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles (id) on delete set null,
  primary key (staff_id, role_id)
);

create index if not exists staff_member_roles_role_idx on public.staff_member_roles (role_id, staff_id);

create table if not exists public.staff_activity_logs (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  target_staff_id uuid references public.staff_profiles (id) on delete set null,
  module text not null,
  action text not null,
  result text not null default 'success',
  ip_address text,
  browser text,
  operating_system text,
  device text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists staff_activity_logs_staff_idx
  on public.staff_activity_logs (staff_id, created_at desc);
create index if not exists staff_activity_logs_module_idx
  on public.staff_activity_logs (module, created_at desc);

create table if not exists public.staff_login_events (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  status text not null check (status in ('success', 'failed')),
  ip_address text,
  browser text,
  operating_system text,
  device text,
  country text,
  city text,
  created_at timestamptz not null default now()
);

create index if not exists staff_login_events_staff_idx
  on public.staff_login_events (staff_id, created_at desc);

create table if not exists public.staff_permission_history (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  role_id text not null references public.staff_role_catalog (id) on delete cascade,
  change_type text not null check (change_type in ('added', 'removed')),
  performed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists staff_permission_history_staff_idx
  on public.staff_permission_history (staff_id, created_at desc);

create or replace function public.staff_activity_logs_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'staff_activity_logs are immutable';
end;
$$;

drop trigger if exists staff_activity_logs_no_update on public.staff_activity_logs;
create trigger staff_activity_logs_no_update
  before update on public.staff_activity_logs
  for each row execute function public.staff_activity_logs_immutable();

drop trigger if exists staff_activity_logs_no_delete on public.staff_activity_logs;
create trigger staff_activity_logs_no_delete
  before delete on public.staff_activity_logs
  for each row execute function public.staff_activity_logs_immutable();

drop trigger if exists staff_profiles_updated_at on public.staff_profiles;
create trigger staff_profiles_updated_at before update on public.staff_profiles
  for each row execute function public.set_updated_at();

alter table public.staff_role_catalog enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.staff_member_roles enable row level security;
alter table public.staff_activity_logs enable row level security;
alter table public.staff_login_events enable row level security;
alter table public.staff_permission_history enable row level security;

drop policy if exists "staff_role_catalog_super_admin" on public.staff_role_catalog;
create policy "staff_role_catalog_super_admin"
  on public.staff_role_catalog for select
  using (public.is_super_admin());

drop policy if exists "staff_profiles_super_admin" on public.staff_profiles;
create policy "staff_profiles_super_admin"
  on public.staff_profiles for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "staff_member_roles_super_admin" on public.staff_member_roles;
create policy "staff_member_roles_super_admin"
  on public.staff_member_roles for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "staff_activity_logs_super_admin_select" on public.staff_activity_logs;
create policy "staff_activity_logs_super_admin_select"
  on public.staff_activity_logs for select
  using (public.is_super_admin());

drop policy if exists "staff_activity_logs_service_insert" on public.staff_activity_logs;
create policy "staff_activity_logs_service_insert"
  on public.staff_activity_logs for insert
  with check (true);

drop policy if exists "staff_login_events_super_admin" on public.staff_login_events;
create policy "staff_login_events_super_admin"
  on public.staff_login_events for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "staff_permission_history_super_admin" on public.staff_permission_history;
create policy "staff_permission_history_super_admin"
  on public.staff_permission_history for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select on table public.staff_role_catalog to authenticated;
grant all on table public.staff_profiles to service_role;
grant all on table public.staff_member_roles to service_role;
grant all on table public.staff_activity_logs to service_role;
grant all on table public.staff_login_events to service_role;
grant all on table public.staff_permission_history to service_role;
grant select on table public.staff_profiles to authenticated;
grant select on table public.staff_member_roles to authenticated;
grant select on table public.staff_activity_logs to authenticated;
grant select on table public.staff_login_events to authenticated;
grant select on table public.staff_permission_history to authenticated;
