-- ROVEXO Smart Notifications Phase 2 — push delivery, grouping, retry (idempotent)

alter table public.notifications
  add column if not exists priority text not null default 'normal',
  add column if not exists silent boolean not null default false,
  add column if not exists group_key text;

alter table public.notification_settings
  add column if not exists browser_push boolean not null default true;

alter table public.notification_delivery_log
  add column if not exists notification_id uuid references public.notifications (id) on delete set null,
  add column if not exists retry_count integer not null default 0,
  add column if not exists next_retry_at timestamptz,
  add column if not exists error_message text,
  add column if not exists priority text not null default 'normal',
  add column if not exists silent boolean not null default false,
  add column if not exists group_key text,
  add column if not exists delivered_at timestamptz;

create index if not exists notification_delivery_log_status_retry_idx
  on public.notification_delivery_log (status, next_retry_at)
  where status = 'failed';

create index if not exists notification_delivery_log_stats_idx
  on public.notification_delivery_log (channel, status, created_at desc);

create index if not exists notifications_group_key_idx
  on public.notifications (user_id, group_key, created_at desc)
  where group_key is not null;

do $do$ begin
  alter table public.notification_delivery_log
    add constraint notification_delivery_log_priority_check
    check (priority in ('low', 'normal', 'high', 'emergency'));
exception when duplicate_object then null;
end $do$;

do $do$ begin
  alter table public.notifications
    add constraint notifications_priority_check
    check (priority in ('low', 'normal', 'high', 'emergency'));
exception when duplicate_object then null;
end $do$;
