-- ============================================================================
-- ROVEXO Resolution Engine v1.0 — Phase 4 (additive only)
-- ============================================================================
-- Automated resolution layer above locked Stripe + Parcel2Go rails.
-- No destructive changes. Service-role writes for automation tables.
-- ============================================================================

-- Reuse commerce immutability guard for append-only ledgers
-- (function public.commerce_prevent_mutation already exists from commerce migration)

-- ---------------------------------------------------------------------------
-- resolution_rules — configurable automation rules
-- ---------------------------------------------------------------------------
create table if not exists public.resolution_rules (
  id text primary key,
  case_type text not null,
  enabled boolean not null default true,
  label text not null default '',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists resolution_rules_updated_at on public.resolution_rules;
create trigger resolution_rules_updated_at before update on public.resolution_rules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- resolution_cases — automated case orchestration
-- ---------------------------------------------------------------------------
create table if not exists public.resolution_cases (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  buyer_id uuid references public.profiles (id) on delete set null,
  seller_id uuid references public.profiles (id) on delete set null,
  protection_case_id uuid references public.protection_cases (id) on delete set null,
  case_type text not null,
  status text not null default 'OPEN' check (
    status in (
      'OPEN', 'PROCESSING', 'WAITING_CARRIER', 'WAITING_TRACKING',
      'WAITING_RETURN', 'APPROVED', 'REJECTED', 'REFUNDED', 'CLOSED'
    )
  ),
  trigger_event text,
  rule_id text references public.resolution_rules (id) on delete set null,
  refund_amount numeric(12, 2),
  decision text,
  estimated_completion_at timestamptz,
  resolved_at timestamptz,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resolution_cases_order_idx on public.resolution_cases (order_id, created_at desc);
create index if not exists resolution_cases_status_idx on public.resolution_cases (status, created_at desc);
create unique index if not exists resolution_cases_open_type_uidx
  on public.resolution_cases (order_id, case_type)
  where status not in ('REFUNDED', 'CLOSED', 'REJECTED');

-- ---------------------------------------------------------------------------
-- resolution_events — immutable case event log
-- ---------------------------------------------------------------------------
create table if not exists public.resolution_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.resolution_cases (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  event_type text not null,
  message text not null default '',
  rule_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists resolution_events_case_idx on public.resolution_events (case_id, created_at asc);
create index if not exists resolution_events_order_idx on public.resolution_events (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- carrier_claims — internal carrier claim ledger (no P2G claim API)
-- ---------------------------------------------------------------------------
create table if not exists public.carrier_claims (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  resolution_case_id uuid references public.resolution_cases (id) on delete set null,
  carrier text,
  tracking_number text,
  claim_type text not null check (claim_type in ('lost', 'damaged', 'failed_delivery')),
  status text not null default 'submitted' check (
    status in ('submitted', 'waiting', 'approved', 'rejected', 'closed')
  ),
  provider text not null default 'parcel2go',
  external_reference text,
  amount_claimed numeric(12, 2) not null default 0,
  amount_approved numeric(12, 2),
  submitted_at timestamptz not null default now(),
  responded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carrier_claims_order_idx on public.carrier_claims (order_id, created_at desc);
create index if not exists carrier_claims_status_idx on public.carrier_claims (status);

-- ---------------------------------------------------------------------------
-- carrier_returns — automated return workflow
-- ---------------------------------------------------------------------------
create table if not exists public.carrier_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  resolution_case_id uuid references public.resolution_cases (id) on delete set null,
  status text not null default 'requested' check (
    status in ('requested', 'label_generated', 'in_transit', 'received', 'refunded', 'rejected')
  ),
  return_tracking_number text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carrier_returns_order_idx on public.carrier_returns (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- carrier_responses — immutable carrier/tracking responses
-- ---------------------------------------------------------------------------
create table if not exists public.carrier_responses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete set null,
  claim_id uuid references public.carrier_claims (id) on delete set null,
  return_id uuid references public.carrier_returns (id) on delete set null,
  source text not null,
  response_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists carrier_responses_order_idx on public.carrier_responses (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- automation_logs — immutable audit of every automated action
-- ---------------------------------------------------------------------------
create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders (id) on delete set null,
  case_id uuid references public.resolution_cases (id) on delete set null,
  action text not null,
  rule_id text,
  decision text,
  stripe_response jsonb,
  parcel2go_response jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists automation_logs_order_idx on public.automation_logs (order_id, created_at desc);
create index if not exists automation_logs_case_idx on public.automation_logs (case_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Immutability triggers (append-only)
-- ---------------------------------------------------------------------------
drop trigger if exists resolution_events_immutable on public.resolution_events;
create trigger resolution_events_immutable
  before update or delete on public.resolution_events
  for each row execute function public.commerce_prevent_mutation();

drop trigger if exists carrier_responses_immutable on public.carrier_responses;
create trigger carrier_responses_immutable
  before update or delete on public.carrier_responses
  for each row execute function public.commerce_prevent_mutation();

drop trigger if exists automation_logs_immutable on public.automation_logs;
create trigger automation_logs_immutable
  before update or delete on public.automation_logs
  for each row execute function public.commerce_prevent_mutation();

drop trigger if exists resolution_cases_updated_at on public.resolution_cases;
create trigger resolution_cases_updated_at before update on public.resolution_cases
  for each row execute function public.set_updated_at();

drop trigger if exists carrier_claims_updated_at on public.carrier_claims;
create trigger carrier_claims_updated_at before update on public.carrier_claims
  for each row execute function public.set_updated_at();

drop trigger if exists carrier_returns_updated_at on public.carrier_returns;
create trigger carrier_returns_updated_at before update on public.carrier_returns
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Default automation rules
-- ---------------------------------------------------------------------------
insert into public.resolution_rules (id, case_type, enabled, label, config)
values
  ('lost_auto_refund', 'lost', true, 'Lost parcel — automatic full refund', '{"refundType":"full","autoApproveHours":0}'::jsonb),
  ('damaged_auto_refund', 'damaged', true, 'Damaged parcel — automatic full refund', '{"refundType":"full","autoApproveHours":0}'::jsonb),
  ('failed_delivery_auto_refund', 'failed_delivery', true, 'Failed delivery — automatic full refund', '{"refundType":"full","autoApproveHours":0}'::jsonb),
  ('return_auto_refund', 'return', true, 'Return received — automatic refund', '{"refundType":"full","returnWindowDays":14}'::jsonb),
  ('delivery_auto_close', 'delivery', true, 'Delivered — auto close after release window', '{"releaseHours":24}'::jsonb),
  ('buyer_confirm_auto_close', 'buyer_confirm', true, 'Buyer confirmed — immediate close', '{}'::jsonb)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.resolution_rules enable row level security;
alter table public.resolution_cases enable row level security;
alter table public.resolution_events enable row level security;
alter table public.carrier_claims enable row level security;
alter table public.carrier_returns enable row level security;
alter table public.carrier_responses enable row level security;
alter table public.automation_logs enable row level security;

drop policy if exists "resolution_rules_select" on public.resolution_rules;
create policy "resolution_rules_select" on public.resolution_rules for select using (true);

drop policy if exists "resolution_cases_select" on public.resolution_cases;
create policy "resolution_cases_select" on public.resolution_cases for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "resolution_events_select" on public.resolution_events;
create policy "resolution_events_select" on public.resolution_events for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.resolution_cases c
      where c.id = case_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

drop policy if exists "carrier_claims_select" on public.carrier_claims;
create policy "carrier_claims_select" on public.carrier_claims for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

drop policy if exists "carrier_returns_select" on public.carrier_returns;
create policy "carrier_returns_select" on public.carrier_returns for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
    )
  );

drop policy if exists "carrier_responses_select" on public.carrier_responses;
create policy "carrier_responses_select" on public.carrier_responses for select
  using (public.is_admin());

drop policy if exists "automation_logs_select" on public.automation_logs;
create policy "automation_logs_select" on public.automation_logs for select
  using (public.is_admin());

grant select on public.resolution_rules to authenticated;
grant select on public.resolution_cases to authenticated;
grant select on public.resolution_events to authenticated;
grant select on public.carrier_claims to authenticated;
grant select on public.carrier_returns to authenticated;
grant select on public.carrier_responses to authenticated;
grant select on public.automation_logs to authenticated;

grant all on public.resolution_rules to service_role;
grant all on public.resolution_cases to service_role;
grant all on public.resolution_events to service_role;
grant all on public.carrier_claims to service_role;
grant all on public.carrier_returns to service_role;
grant all on public.carrier_responses to service_role;
grant all on public.automation_logs to service_role;
