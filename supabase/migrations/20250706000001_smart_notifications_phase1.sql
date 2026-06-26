-- ROVEXO Smart Notifications Phase 1 (idempotent)

do $do$ begin
  alter type public.notification_type add value if not exists 'support_reply';
exception when duplicate_object then null;
end $do$;

do $do$ begin
  alter type public.notification_type add value if not exists 'business_lead';
exception when duplicate_object then null;
end $do$;

do $do$ begin
  alter type public.notification_type add value if not exists 'listing_expiring';
exception when duplicate_object then null;
end $do$;

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  orders boolean not null default true,
  messages boolean not null default true,
  payments boolean not null default true,
  support boolean not null default true,
  marketing boolean not null default false,
  security boolean not null default true,
  business boolean not null default true,
  ai boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null,
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  notification_id uuid references public.notifications (id) on delete set null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notification_events_idempotency_unique unique (idempotency_key)
);

create index if not exists notification_events_user_created_idx
  on public.notification_events (user_id, created_at desc);

create index if not exists notification_events_unprocessed_idx
  on public.notification_events (created_at)
  where processed_at is null;

create index if not exists notifications_user_type_unread_idx
  on public.notifications (user_id, type)
  where read = false;

create index if not exists notifications_user_href_unread_idx
  on public.notifications (user_id, href)
  where read = false;

alter table public.notification_preferences enable row level security;
alter table public.notification_events enable row level security;

do $do$ begin
  create policy notification_preferences_select_own
    on public.notification_preferences for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create policy notification_preferences_update_own
    on public.notification_preferences for update
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create policy notification_preferences_insert_own
    on public.notification_preferences for insert
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create policy notification_events_select_own
    on public.notification_events for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $do$;

do $do$ begin
  alter publication supabase_realtime add table public.notification_events;
exception when duplicate_object then null;
end $do$;

create or replace function public.seed_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists seed_notification_preferences_on_profile on public.profiles;
create trigger seed_notification_preferences_on_profile
  after insert on public.profiles
  for each row execute function public.seed_notification_preferences();

insert into public.notification_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;
