-- ROVEXO Staff Communications Platform — voice, video, messaging, offline (production)

do $do$ begin
  create type public.staff_call_type as enum ('voice', 'video', 'conference');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.staff_call_status as enum (
    'ringing',
    'active',
    'held',
    'ended',
    'missed',
    'declined',
    'failed'
  );
exception when duplicate_object then null;
end $do$;

create table if not exists public.staff_call_sessions (
  id uuid primary key default gen_random_uuid(),
  call_type public.staff_call_type not null default 'voice',
  status public.staff_call_status not null default 'ringing',
  initiator_staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  channel_id uuid references public.staff_channels (id) on delete set null,
  conference_name text,
  recording_enabled boolean not null default false,
  recording_storage_path text,
  started_at timestamptz not null default now(),
  answered_at timestamptz,
  ended_at timestamptz,
  end_reason text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists staff_call_sessions_initiator_idx
  on public.staff_call_sessions (initiator_staff_id, started_at desc);
create index if not exists staff_call_sessions_status_idx
  on public.staff_call_sessions (status, started_at desc);

create table if not exists public.staff_call_participants (
  call_id uuid not null references public.staff_call_sessions (id) on delete cascade,
  staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  joined_at timestamptz,
  left_at timestamptz,
  muted boolean not null default false,
  video_enabled boolean not null default true,
  speaker_enabled boolean not null default false,
  is_host boolean not null default false,
  primary key (call_id, staff_id)
);

create table if not exists public.staff_call_signals (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.staff_call_sessions (id) on delete cascade,
  sender_staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  target_staff_id uuid references public.staff_profiles (id) on delete cascade,
  signal_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists staff_call_signals_call_idx
  on public.staff_call_signals (call_id, created_at desc);

create table if not exists public.staff_message_reads (
  message_id uuid not null references public.staff_messages (id) on delete cascade,
  staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, staff_id)
);

create table if not exists public.staff_message_typing (
  channel_id uuid not null references public.staff_channels (id) on delete cascade,
  staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  expires_at timestamptz not null,
  primary key (channel_id, staff_id)
);

create table if not exists public.staff_message_pins (
  channel_id uuid not null references public.staff_channels (id) on delete cascade,
  message_id uuid not null references public.staff_messages (id) on delete cascade,
  pinned_by uuid references public.profiles (id) on delete set null,
  pinned_at timestamptz not null default now(),
  primary key (channel_id, message_id)
);

create table if not exists public.staff_message_bookmarks (
  staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  message_id uuid not null references public.staff_messages (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (staff_id, message_id)
);

create table if not exists public.staff_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.staff_messages (id) on delete cascade,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  storage_path text not null,
  scan_status text not null default 'clean',
  created_at timestamptz not null default now()
);

create table if not exists public.staff_offline_queue (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff_profiles (id) on delete cascade,
  action_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  synced_at timestamptz
);

create index if not exists staff_offline_queue_staff_idx
  on public.staff_offline_queue (staff_id, synced_at nulls first);

alter table public.staff_messages
  add column if not exists message_type text not null default 'text',
  add column if not exists mention_staff_ids uuid[] default '{}';

alter table public.staff_registered_devices
  add column if not exists push_token text,
  add column if not exists push_platform text;

-- Realtime publication for staff comms tables
do $do$ begin
  alter publication supabase_realtime add table public.staff_messages;
exception when duplicate_object then null;
end $do$;

do $do$ begin
  alter publication supabase_realtime add table public.staff_presence;
exception when duplicate_object then null;
end $do$;

do $do$ begin
  alter publication supabase_realtime add table public.staff_call_sessions;
exception when duplicate_object then null;
end $do$;

do $do$ begin
  alter publication supabase_realtime add table public.staff_message_typing;
exception when duplicate_object then null;
end $do$;

alter table public.staff_call_sessions enable row level security;
alter table public.staff_call_participants enable row level security;
alter table public.staff_call_signals enable row level security;
alter table public.staff_message_reads enable row level security;
alter table public.staff_message_typing enable row level security;
alter table public.staff_message_pins enable row level security;
alter table public.staff_message_bookmarks enable row level security;
alter table public.staff_message_attachments enable row level security;
alter table public.staff_offline_queue enable row level security;

drop policy if exists "staff_calls_participant" on public.staff_call_sessions;
create policy "staff_calls_participant"
  on public.staff_call_sessions for select
  using (public.is_super_admin() or exists (
    select 1 from public.staff_call_participants p
    join public.staff_profiles sp on sp.id = p.staff_id
    where p.call_id = staff_call_sessions.id and sp.profile_id = auth.uid() and sp.status = 'active'
  ));

drop policy if exists "staff_call_participants_read" on public.staff_call_participants;
create policy "staff_call_participants_read"
  on public.staff_call_participants for select
  using (public.is_super_admin() or exists (
    select 1 from public.staff_profiles sp
    where sp.id = staff_call_participants.staff_id and sp.profile_id = auth.uid()
  ));

drop policy if exists "staff_offline_queue_self" on public.staff_offline_queue;
create policy "staff_offline_queue_self"
  on public.staff_offline_queue for all
  using (exists (
    select 1 from public.staff_profiles sp
    where sp.id = staff_offline_queue.staff_id and sp.profile_id = auth.uid() and sp.status = 'active'
  ))
  with check (exists (
    select 1 from public.staff_profiles sp
    where sp.id = staff_offline_queue.staff_id and sp.profile_id = auth.uid() and sp.status = 'active'
  ));

grant all on table public.staff_call_sessions to service_role;
grant all on table public.staff_call_participants to service_role;
grant all on table public.staff_call_signals to service_role;
grant all on table public.staff_message_reads to service_role;
grant all on table public.staff_message_typing to service_role;
grant all on table public.staff_message_pins to service_role;
grant all on table public.staff_message_bookmarks to service_role;
grant all on table public.staff_message_attachments to service_role;
grant all on table public.staff_offline_queue to service_role;
grant select on table public.staff_call_sessions to authenticated;
grant select on table public.staff_call_participants to authenticated;
grant select on table public.staff_message_reads to authenticated;
grant select on table public.staff_message_typing to authenticated;
