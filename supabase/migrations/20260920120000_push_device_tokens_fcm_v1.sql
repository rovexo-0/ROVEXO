-- Marketplace Native FCM device tokens (beside Web Push).
-- Does NOT modify public.push_subscriptions or VAPID semantics.
-- Tokens are server-owned. Authenticated clients have no SELECT.

create table if not exists public.push_device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  provider text not null,
  platform text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_device_tokens_token_key unique (token),
  constraint push_device_tokens_provider_check check (provider = 'fcm'),
  constraint push_device_tokens_platform_check check (platform = 'android')
);

create index if not exists push_device_tokens_user_idx
  on public.push_device_tokens (user_id);

create unique index if not exists push_device_tokens_token_uidx
  on public.push_device_tokens (token);

alter table public.push_device_tokens enable row level security;

revoke all on table public.push_device_tokens from anon, authenticated;
grant all on table public.push_device_tokens to service_role;

drop trigger if exists push_device_tokens_updated_at on public.push_device_tokens;
create trigger push_device_tokens_updated_at
  before update on public.push_device_tokens
  for each row execute function public.set_updated_at();

comment on table public.push_device_tokens is
  'Native FCM registration tokens. Parallel to push_subscriptions (Web Push). Service-role writes only.';
