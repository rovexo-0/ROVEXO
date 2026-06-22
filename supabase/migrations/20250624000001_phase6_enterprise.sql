-- Phase 6: Enterprise production expansion
-- Categories, trust & safety, shipping, buyer/seller protection

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $do$ begin
  create type public.moderation_risk_level as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.shipping_method as enum (
    'collection_only', 'local_delivery', 'delivery_available'
  );
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.shipment_status as enum (
    'pending', 'label_created', 'dispatched', 'in_transit', 'out_for_delivery', 'delivered', 'failed'
  );
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.protection_case_type as enum ('refund', 'return', 'dispute', 'appeal');
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.protection_case_status as enum (
    'open', 'awaiting_seller', 'awaiting_buyer', 'under_review', 'resolved', 'appealed', 'closed'
  );
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.protection_case_outcome as enum (
    'pending', 'refund_full', 'refund_partial', 'return_accepted', 'return_rejected', 'no_action', 'seller_favour', 'buyer_favour'
  );
exception when duplicate_object then null;
end $do$;

do $do$ begin
  create type public.category_filter_type as enum (
    'text', 'number', 'select', 'boolean', 'range'
  );
exception when duplicate_object then null;
end $do$;

-- ---------------------------------------------------------------------------
-- Categories: enterprise metadata
-- ---------------------------------------------------------------------------
alter table public.categories
  add column if not exists icon text not null default '🏷️',
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists is_active boolean not null default true;

create table if not exists public.category_filter_definitions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  filter_key text not null,
  label text not null,
  filter_type public.category_filter_type not null default 'select',
  options jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, filter_key)
);

create index if not exists category_filter_definitions_category_idx
  on public.category_filter_definitions (category_id, sort_order);

-- ---------------------------------------------------------------------------
-- Moderation: risk scoring
-- ---------------------------------------------------------------------------
alter table public.moderation_queue
  add column if not exists risk_level public.moderation_risk_level not null default 'low',
  add column if not exists risk_score numeric(5, 2) not null default 0;

create index if not exists moderation_queue_risk_idx
  on public.moderation_queue (risk_level, status, created_at desc);

-- ---------------------------------------------------------------------------
-- Shipping: product options and order shipments
-- ---------------------------------------------------------------------------
alter table public.products
  add column if not exists shipping_method public.shipping_method not null default 'delivery_available',
  add column if not exists shipping_price numeric(10, 2),
  add column if not exists dispatch_days integer not null default 2,
  add column if not exists local_delivery_radius_km numeric(6, 2);

alter table public.orders
  add column if not exists shipping_method public.shipping_method not null default 'delivery_available',
  add column if not exists estimated_delivery_at timestamptz,
  add column if not exists dispatch_by timestamptz;

create table if not exists public.order_shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  carrier text not null,
  tracking_number text,
  status public.shipment_status not null default 'pending',
  dispatch_at timestamptz,
  estimated_delivery_at timestamptz,
  delivered_at timestamptz,
  last_event text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists order_shipments_order_idx on public.order_shipments (order_id);
create index if not exists order_shipments_tracking_idx on public.order_shipments (tracking_number);

-- ---------------------------------------------------------------------------
-- Buyer & seller protection
-- ---------------------------------------------------------------------------
create table if not exists public.protection_cases (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  buyer_id uuid not null references public.profiles (id) on delete restrict,
  seller_id uuid not null references public.profiles (id) on delete restrict,
  case_type public.protection_case_type not null,
  status public.protection_case_status not null default 'open',
  outcome public.protection_case_outcome not null default 'pending',
  reason text not null,
  description text not null default '',
  refund_amount numeric(10, 2),
  admin_id uuid references public.profiles (id) on delete set null,
  admin_notes text not null default '',
  appeal_reason text,
  appealed_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists protection_cases_order_idx on public.protection_cases (order_id);
create index if not exists protection_cases_buyer_idx on public.protection_cases (buyer_id, status);
create index if not exists protection_cases_seller_idx on public.protection_cases (seller_id, status);
create index if not exists protection_cases_status_idx on public.protection_cases (status, created_at desc);

create table if not exists public.protection_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.protection_cases (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  message text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists protection_case_events_case_idx
  on public.protection_case_events (case_id, created_at);

create table if not exists public.protection_evidence (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.protection_cases (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id) on delete cascade,
  file_url text not null,
  file_name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists protection_evidence_case_idx on public.protection_evidence (case_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
drop trigger if exists category_filter_definitions_updated_at on public.category_filter_definitions;
create trigger category_filter_definitions_updated_at before update on public.category_filter_definitions
  for each row execute function public.set_updated_at();

drop trigger if exists order_shipments_updated_at on public.order_shipments;
create trigger order_shipments_updated_at before update on public.order_shipments
  for each row execute function public.set_updated_at();

drop trigger if exists protection_cases_updated_at on public.protection_cases;
create trigger protection_cases_updated_at before update on public.protection_cases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.category_filter_definitions enable row level security;
alter table public.order_shipments enable row level security;
alter table public.protection_cases enable row level security;
alter table public.protection_case_events enable row level security;
alter table public.protection_evidence enable row level security;

drop policy if exists "category_filter_definitions_select_all" on public.category_filter_definitions;
create policy "category_filter_definitions_select_all"
  on public.category_filter_definitions for select
  to authenticated, anon
  using (true);

drop policy if exists "category_filter_definitions_admin_all" on public.category_filter_definitions;
create policy "category_filter_definitions_admin_all"
  on public.category_filter_definitions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "order_shipments_parties_select" on public.order_shipments;
create policy "order_shipments_parties_select"
  on public.order_shipments for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.buyer_id = auth.uid() or o.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "order_shipments_seller_insert" on public.order_shipments;
create policy "order_shipments_seller_insert"
  on public.order_shipments for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.seller_id = auth.uid()
    )
  );

drop policy if exists "order_shipments_seller_update" on public.order_shipments;
create policy "order_shipments_seller_update"
  on public.order_shipments for update
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "protection_cases_parties_select" on public.protection_cases;
create policy "protection_cases_parties_select"
  on public.protection_cases for select
  to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "protection_cases_buyer_insert" on public.protection_cases;
create policy "protection_cases_buyer_insert"
  on public.protection_cases for insert
  to authenticated
  with check (buyer_id = auth.uid());

drop policy if exists "protection_cases_parties_update" on public.protection_cases;
create policy "protection_cases_parties_update"
  on public.protection_cases for update
  to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

drop policy if exists "protection_case_events_parties_select" on public.protection_case_events;
create policy "protection_case_events_parties_select"
  on public.protection_case_events for select
  to authenticated
  using (
    exists (
      select 1 from public.protection_cases c
      where c.id = case_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "protection_case_events_parties_insert" on public.protection_case_events;
create policy "protection_case_events_parties_insert"
  on public.protection_case_events for insert
  to authenticated
  with check (
    exists (
      select 1 from public.protection_cases c
      where c.id = case_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "protection_evidence_parties_select" on public.protection_evidence;
create policy "protection_evidence_parties_select"
  on public.protection_evidence for select
  to authenticated
  using (
    exists (
      select 1 from public.protection_cases c
      where c.id = case_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "protection_evidence_parties_insert" on public.protection_evidence;
create policy "protection_evidence_parties_insert"
  on public.protection_evidence for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.protection_cases c
      where c.id = case_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Seed missing top-level categories
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, parent_id, path_label, sort_order, icon)
select 'Travel', 'travel', null, 'Travel', 27, '✈️'
where not exists (select 1 from public.categories where slug = 'travel' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order, icon)
select 'Events', 'events', null, 'Events', 28, '🎉'
where not exists (select 1 from public.categories where slug = 'events' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order, icon)
select 'Free Stuff', 'free-stuff', null, 'Free Stuff', 29, '🎁'
where not exists (select 1 from public.categories where slug = 'free-stuff' and parent_id is null);

insert into public.categories (name, slug, parent_id, path_label, sort_order, icon)
select 'Everything Else', 'everything-else', null, 'Everything Else', 30, '📦'
where not exists (select 1 from public.categories where slug = 'everything-else' and parent_id is null);

-- Sync icons for existing top-level categories
update public.categories set icon = '🚗' where slug = 'vehicles' and parent_id is null;
update public.categories set icon = '🏠' where slug = 'property' and parent_id is null;
update public.categories set icon = '📱' where slug = 'electronics' and parent_id is null;
update public.categories set icon = '👗' where slug = 'fashion' and parent_id is null;
update public.categories set icon = '🌿' where slug = 'home-garden' and parent_id is null;
update public.categories set icon = '🔨' where slug = 'diy' and parent_id is null;
update public.categories set icon = '🛠️' where slug = 'tools' and parent_id is null;
update public.categories set icon = '⚽' where slug = 'sports' and parent_id is null;
update public.categories set icon = '💊' where slug = 'health' and parent_id is null;
update public.categories set icon = '💄' where slug = 'beauty' and parent_id is null;
update public.categories set icon = '🐾' where slug = 'pets' and parent_id is null;
update public.categories set icon = '👶' where slug = 'baby-kids' and parent_id is null;
update public.categories set icon = '🧸' where slug = 'toys' and parent_id is null;
update public.categories set icon = '📚' where slug = 'books' and parent_id is null;
update public.categories set icon = '🎵' where slug = 'music' and parent_id is null;
update public.categories set icon = '🎬' where slug = 'movies' and parent_id is null;
update public.categories set icon = '🎮' where slug = 'gaming' and parent_id is null;
update public.categories set icon = '🏆' where slug = 'collectibles' and parent_id is null;
update public.categories set icon = '💼' where slug = 'business' and parent_id is null;
update public.categories set icon = '💼' where slug = 'jobs' and parent_id is null;
update public.categories set icon = '🤝' where slug = 'services' and parent_id is null;
update public.categories set icon = '🎫' where slug = 'tickets' and parent_id is null;
update public.categories set icon = '🍽️' where slug = 'food' and parent_id is null;
update public.categories set icon = '🖇️' where slug = 'office' and parent_id is null;
update public.categories set icon = '🏭' where slug = 'industrial' and parent_id is null;
update public.categories set icon = '🌾' where slug = 'agriculture' and parent_id is null;
