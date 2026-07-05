-- ROVEXO Staff Enterprise Platform — extends staff-profile SSOT (no duplicate user tables)

do $do$ begin
  create type public.staff_presence_status as enum (
    'online',
    'away',
    'busy',
    'offline',
    'do_not_disturb',
    'invisible'
  );
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.staff_device_platform as enum (
    'android',
    'ios',
    'windows',
    'macos',
    'web',
    'browser'
  );
exception when duplicate_object then null;
end $do$;

-- Extend role catalog (idempotent upserts)
insert into public.staff_role_catalog (id, label, description, sort_order)
values
  ('super_admin', 'Super Admin', 'Full unrestricted platform access', 0),
  ('admin', 'Admin', 'Platform administration', 1),
  ('manager', 'Manager', 'Team and operations management', 2),
  ('support', 'Support', 'Customer support operations', 3),
  ('contact_center', 'Contact Center', 'Contact centre operations', 4),
  ('marketplace_moderator', 'Marketplace Moderator', 'Listing and content moderation', 5),
  ('finance', 'Finance', 'Payments, refunds, and wallet operations', 6),
  ('shipping', 'Shipping', 'Logistics and fulfilment operations', 7),
  ('warehouse', 'Warehouse', 'Warehouse and inventory operations', 8),
  ('marketing', 'Marketing', 'Marketing campaigns and growth', 9),
  ('design_studio', 'Design Studio', 'Design studio and brand assets', 10),
  ('content_manager', 'Content Manager', 'CMS and content publishing', 11),
  ('business', 'Business', 'Verified business account operations', 12),
  ('ai_team', 'AI Team', 'AI systems and automation', 13),
  ('security', 'Security', 'Security operations and compliance', 14),
  ('operations', 'Operations', 'Platform operations and NOC', 15),
  ('hr', 'HR', 'Human resources and personnel', 16),
  ('developer', 'Developer', 'Engineering and development', 17),
  ('administrator', 'Administrator', 'Legacy alias for platform administration', 18)
on conflict (id) do update
set label = excluded.label, description = excluded.description, sort_order = excluded.sort_order;

create table if not exists public.staff_departments (
  id text primary key,
  label text not null,
  description text,
  sort_order integer not null default 0
);

insert into public.staff_departments (id, label, description, sort_order)
values
  ('support', 'Support', 'Customer support', 1),
  ('finance', 'Finance', 'Finance and payments', 2),
  ('shipping', 'Shipping', 'Logistics', 3),
  ('marketing', 'Marketing', 'Marketing', 4),
  ('security', 'Security', 'Security', 5),
  ('operations', 'Operations', 'Operations', 6),
  ('management', 'Management', 'Management', 7),
  ('administration', 'Administration', 'Administration', 8),
  ('development', 'Development', 'Engineering', 9),
  ('design', 'Design', 'Design studio', 10),
  ('ai', 'AI', 'AI team', 11),
  ('content', 'Content', 'Content management', 12)
on conflict (id) do update
set label = excluded.label, description = excluded.description, sort_order = excluded.sort_order;

alter table public.staff_profiles
  add column if not exists department_id text references public.staff_departments (id) on delete set null,
  add column if not exists position text,
  add column if not exists extension text,
  add column if not exists company_email_encrypted text,
  add column if not exists company_phone_encrypted text,
  add column if not exists avatar_url text,
  add column if not exists skills jsonb not null default '[]'::jsonb,
  add column if not exists emergency_contact_encrypted text,
  add column if not exists availability text;

create table if not exists public.staff_member_departments (
  staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  department_id text not null references public.staff_departments (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (staff_id, department_id)
);

create table if not exists public.staff_presence (
  staff_id uuid primary key references public.staff_profiles (id) on delete cascade,
  status public.staff_presence_status not null default 'offline',
  message text,
  last_active_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_registered_devices (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  platform public.staff_device_platform not null default 'web',
  device_name text not null,
  os_name text,
  os_version text,
  browser text,
  ip_address text,
  approximate_location text,
  trusted boolean not null default false,
  blocked boolean not null default false,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists staff_registered_devices_staff_idx
  on public.staff_registered_devices (staff_id, last_seen_at desc);

create table if not exists public.staff_permission_grants (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  module text not null,
  action text not null,
  granted boolean not null default true,
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (staff_id, module, action)
);

create table if not exists public.staff_channels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  channel_type text not null check (channel_type in ('direct', 'department', 'project', 'broadcast')),
  department_id text references public.staff_departments (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_channel_members (
  channel_id uuid not null references public.staff_channels (id) on delete cascade,
  staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (channel_id, staff_id)
);

create table if not exists public.staff_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.staff_channels (id) on delete cascade,
  sender_staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  body text not null,
  rich_body jsonb,
  reply_to_id uuid references public.staff_messages (id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists staff_messages_channel_idx
  on public.staff_messages (channel_id, created_at desc);

drop trigger if exists staff_presence_updated_at on public.staff_presence;
create trigger staff_presence_updated_at before update on public.staff_presence
  for each row execute function public.set_updated_at();

alter table public.staff_departments enable row level security;
alter table public.staff_member_departments enable row level security;
alter table public.staff_presence enable row level security;
alter table public.staff_registered_devices enable row level security;
alter table public.staff_permission_grants enable row level security;
alter table public.staff_channels enable row level security;
alter table public.staff_channel_members enable row level security;
alter table public.staff_messages enable row level security;

drop policy if exists "staff_departments_staff_read" on public.staff_departments;
create policy "staff_departments_staff_read"
  on public.staff_departments for select
  using (public.is_super_admin() or exists (
    select 1 from public.staff_profiles sp
    where sp.profile_id = auth.uid() and sp.status = 'active'
  ));

drop policy if exists "staff_presence_staff" on public.staff_presence;
create policy "staff_presence_staff"
  on public.staff_presence for all
  using (public.is_super_admin() or exists (
    select 1 from public.staff_profiles sp
    where sp.id = staff_presence.staff_id and sp.profile_id = auth.uid() and sp.status = 'active'
  ))
  with check (public.is_super_admin() or exists (
    select 1 from public.staff_profiles sp
    where sp.id = staff_presence.staff_id and sp.profile_id = auth.uid() and sp.status = 'active'
  ));

drop policy if exists "staff_messages_staff" on public.staff_messages;
create policy "staff_messages_staff"
  on public.staff_messages for select
  using (public.is_super_admin() or exists (
    select 1 from public.staff_channel_members m
    join public.staff_profiles sp on sp.id = m.staff_id
    where m.channel_id = staff_messages.channel_id and sp.profile_id = auth.uid() and sp.status = 'active'
  ));

drop policy if exists "staff_messages_staff_insert" on public.staff_messages;
create policy "staff_messages_staff_insert"
  on public.staff_messages for insert
  with check (public.is_super_admin() or exists (
    select 1 from public.staff_channel_members m
    join public.staff_profiles sp on sp.id = m.staff_id
    where m.channel_id = staff_messages.channel_id
      and sp.id = staff_messages.sender_staff_id
      and sp.profile_id = auth.uid()
      and sp.status = 'active'
  ));

grant select on table public.staff_departments to authenticated;
grant all on table public.staff_member_departments to service_role;
grant all on table public.staff_presence to service_role;
grant all on table public.staff_registered_devices to service_role;
grant all on table public.staff_permission_grants to service_role;
grant all on table public.staff_channels to service_role;
grant all on table public.staff_channel_members to service_role;
grant all on table public.staff_messages to service_role;
grant select on table public.staff_presence to authenticated;
grant select on table public.staff_registered_devices to authenticated;
grant select on table public.staff_channels to authenticated;
grant select on table public.staff_channel_members to authenticated;
grant select on table public.staff_messages to authenticated;
