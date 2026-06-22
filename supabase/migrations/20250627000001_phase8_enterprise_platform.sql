-- Phase 8: Trust + Business + Wholesale + Monetization + Platform Analytics

create type public.trust_verification_type as enum (
  'email',
  'phone',
  'identity',
  'address',
  'payment',
  'business',
  'wholesale',
  'manufacturer',
  'supplier',
  'document'
);

create type public.trust_verification_status as enum (
  'not_started',
  'pending',
  'approved',
  'rejected',
  'expired'
);

create type public.trust_verification_level as enum (
  'basic',
  'verified',
  'premium',
  'enterprise'
);

create type public.wholesale_account_type as enum (
  'wholesale',
  'manufacturer',
  'supplier',
  'importer',
  'exporter'
);

create type public.monetization_plan_tier as enum (
  'free',
  'seller_pro',
  'business',
  'wholesale',
  'enterprise'
);

create type public.monetization_subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired'
);

alter table public.business_accounts
  add column if not exists company_type text not null default 'company',
  add column if not exists description text not null default '',
  add column if not exists verified_business boolean not null default false,
  add column if not exists verified_wholesale boolean not null default false,
  add column if not exists verified_manufacturer boolean not null default false,
  add column if not exists verified_supplier boolean not null default false,
  add column if not exists trust_score integer not null default 0,
  add column if not exists verification_level public.trust_verification_level not null default 'basic';

create table if not exists public.trust_scores (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  score integer not null default 50 check (score >= 0 and score <= 100),
  buyer_score integer not null default 50 check (buyer_score >= 0 and buyer_score <= 100),
  seller_score integer not null default 50 check (seller_score >= 0 and seller_score <= 100),
  business_score integer not null default 50 check (business_score >= 0 and business_score <= 100),
  level public.trust_verification_level not null default 'basic',
  updated_at timestamptz not null default now()
);

create table if not exists public.trust_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  verification_type public.trust_verification_type not null,
  status public.trust_verification_status not null default 'not_started',
  level public.trust_verification_level not null default 'basic',
  document_urls text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  reviewer_id uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, verification_type)
);

create table if not exists public.trust_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null,
  delta integer not null default 0,
  score_after integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists trust_verifications_user_idx on public.trust_verifications (user_id, status);
create index if not exists trust_events_user_idx on public.trust_events (user_id, created_at desc);

create table if not exists public.wholesale_accounts (
  id uuid primary key references public.profiles (id) on delete cascade,
  account_type public.wholesale_account_type not null default 'wholesale',
  company_name text not null,
  moq_default integer not null default 1 check (moq_default >= 1),
  bulk_pricing_enabled boolean not null default false,
  rfq_enabled boolean not null default true,
  verified boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wholesale_pricing_tiers (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  min_quantity integer not null check (min_quantity >= 1),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  currency text not null default 'GBP',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wholesale_pricing_seller_idx on public.wholesale_pricing_tiers (seller_id, active);

create table if not exists public.rfq_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid references public.profiles (id) on delete set null,
  title text not null,
  description text not null default '',
  quantity integer not null default 1 check (quantity >= 1),
  category_slug text,
  status text not null default 'open',
  premium boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rfq_requests_buyer_idx on public.rfq_requests (buyer_id, created_at desc);
create index if not exists rfq_requests_status_idx on public.rfq_requests (status, created_at desc);

create table if not exists public.monetization_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tier public.monetization_plan_tier not null,
  price_cents integer not null default 0,
  interval text not null default 'month',
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monetization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.monetization_plans (id),
  status public.monetization_subscription_status not null default 'active',
  stripe_subscription_id text,
  current_period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists monetization_subscriptions_user_idx on public.monetization_subscriptions (user_id, status);

create table if not exists public.platform_analytics_events (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  metric text not null,
  value numeric(14,2) not null default 0,
  dimensions jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create index if not exists platform_analytics_domain_idx on public.platform_analytics_events (domain, metric, recorded_at desc);

create table if not exists public.platform_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.monetization_plans (slug, name, tier, price_cents, interval, features, sort_order)
values
  ('seller-free', 'Seller Free', 'free', 0, 'month', '["basic_listings","standard_support"]'::jsonb, 1),
  ('seller-pro', 'Seller Pro', 'seller_pro', 999, 'month', '["analytics","priority_support","promotion_discounts"]'::jsonb, 2),
  ('business', 'Business', 'business', 2999, 'month', '["business_dashboard","verified_badge","leads"]'::jsonb, 3),
  ('wholesale', 'Wholesale', 'wholesale', 4999, 'month', '["bulk_pricing","rfq","wholesale_badge"]'::jsonb, 4),
  ('enterprise', 'Enterprise', 'enterprise', 9999, 'month', '["premium_ai","priority_search","dedicated_support"]'::jsonb, 5)
on conflict (slug) do nothing;

alter table public.trust_scores enable row level security;
alter table public.trust_verifications enable row level security;
alter table public.trust_events enable row level security;
alter table public.wholesale_accounts enable row level security;
alter table public.wholesale_pricing_tiers enable row level security;
alter table public.rfq_requests enable row level security;
alter table public.monetization_plans enable row level security;
alter table public.monetization_subscriptions enable row level security;
alter table public.platform_analytics_events enable row level security;
alter table public.platform_audit_logs enable row level security;

drop policy if exists "trust_scores_self_read" on public.trust_scores;
create policy "trust_scores_self_read"
  on public.trust_scores for select
  to authenticated, anon
  using (true);

drop policy if exists "trust_scores_self_update" on public.trust_scores;
create policy "trust_scores_self_update"
  on public.trust_scores for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "trust_verifications_self" on public.trust_verifications;
create policy "trust_verifications_self"
  on public.trust_verifications for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "trust_verifications_self_insert" on public.trust_verifications;
create policy "trust_verifications_self_insert"
  on public.trust_verifications for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "trust_verifications_admin" on public.trust_verifications;
create policy "trust_verifications_admin"
  on public.trust_verifications for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "trust_events_self_read" on public.trust_events;
create policy "trust_events_self_read"
  on public.trust_events for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "wholesale_accounts_public_read" on public.wholesale_accounts;
create policy "wholesale_accounts_public_read"
  on public.wholesale_accounts for select
  to authenticated, anon
  using (true);

drop policy if exists "wholesale_accounts_self_write" on public.wholesale_accounts;
create policy "wholesale_accounts_self_write"
  on public.wholesale_accounts for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "wholesale_pricing_public_read" on public.wholesale_pricing_tiers;
create policy "wholesale_pricing_public_read"
  on public.wholesale_pricing_tiers for select
  to authenticated, anon
  using (active = true);

drop policy if exists "wholesale_pricing_self" on public.wholesale_pricing_tiers;
create policy "wholesale_pricing_self"
  on public.wholesale_pricing_tiers for all
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

drop policy if exists "rfq_requests_buyer" on public.rfq_requests;
create policy "rfq_requests_buyer"
  on public.rfq_requests for all
  to authenticated
  using (auth.uid() = buyer_id or public.is_admin())
  with check (auth.uid() = buyer_id);

drop policy if exists "rfq_requests_seller_read" on public.rfq_requests;
create policy "rfq_requests_seller_read"
  on public.rfq_requests for select
  to authenticated
  using (auth.uid() = seller_id or seller_id is null or public.is_admin());

drop policy if exists "monetization_plans_public_read" on public.monetization_plans;
create policy "monetization_plans_public_read"
  on public.monetization_plans for select
  to authenticated, anon
  using (active = true);

drop policy if exists "monetization_plans_admin" on public.monetization_plans;
create policy "monetization_plans_admin"
  on public.monetization_plans for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "monetization_subscriptions_self" on public.monetization_subscriptions;
create policy "monetization_subscriptions_self"
  on public.monetization_subscriptions for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "platform_analytics_admin" on public.platform_analytics_events;
create policy "platform_analytics_admin"
  on public.platform_analytics_events for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "platform_audit_admin" on public.platform_audit_logs;
create policy "platform_audit_admin"
  on public.platform_audit_logs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists trust_scores_updated_at on public.trust_scores;
create trigger trust_scores_updated_at before update on public.trust_scores
  for each row execute function public.set_updated_at();

drop trigger if exists trust_verifications_updated_at on public.trust_verifications;
create trigger trust_verifications_updated_at before update on public.trust_verifications
  for each row execute function public.set_updated_at();

drop trigger if exists wholesale_accounts_updated_at on public.wholesale_accounts;
create trigger wholesale_accounts_updated_at before update on public.wholesale_accounts
  for each row execute function public.set_updated_at();

drop trigger if exists wholesale_pricing_updated_at on public.wholesale_pricing_tiers;
create trigger wholesale_pricing_updated_at before update on public.wholesale_pricing_tiers
  for each row execute function public.set_updated_at();

drop trigger if exists rfq_requests_updated_at on public.rfq_requests;
create trigger rfq_requests_updated_at before update on public.rfq_requests
  for each row execute function public.set_updated_at();

drop trigger if exists monetization_plans_updated_at on public.monetization_plans;
create trigger monetization_plans_updated_at before update on public.monetization_plans
  for each row execute function public.set_updated_at();

drop trigger if exists monetization_subscriptions_updated_at on public.monetization_subscriptions;
create trigger monetization_subscriptions_updated_at before update on public.monetization_subscriptions
  for each row execute function public.set_updated_at();
