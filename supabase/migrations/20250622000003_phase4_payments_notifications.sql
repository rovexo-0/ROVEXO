-- Phase 4 payments metadata + push notification subscriptions

alter table public.orders
  add column if not exists platform_fee numeric(12, 2) not null default 0,
  add column if not exists seller_payout numeric(12, 2) not null default 0,
  add column if not exists invoice_number text,
  add column if not exists receipt_url text;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  platform text not null default 'web',
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

create table if not exists public.notification_delivery_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  channel text not null,
  event_type text not null,
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
alter table public.notification_delivery_log enable row level security;

drop policy if exists "push_subscriptions_self" on public.push_subscriptions;
create policy "push_subscriptions_self"
  on public.push_subscriptions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notification_delivery_log_self" on public.notification_delivery_log;
create policy "notification_delivery_log_self"
  on public.notification_delivery_log for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop trigger if exists push_subscriptions_updated_at on public.push_subscriptions;
create trigger push_subscriptions_updated_at before update on public.push_subscriptions
  for each row execute function public.set_updated_at();
