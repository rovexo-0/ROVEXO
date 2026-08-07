-- ============================================================================
-- ROVEXO — P0 REALTIME FOUNDATION
-- File: supabase/migrations/20260807123000_realtime_domain_publication_p0_v1.sql
-- PostgreSQL / Supabase · fully idempotent · production-safe
-- Safe to re-run. Never aborts because one table fails expected publication checks.
-- No table recreation · no DROP · no data loss beyond duplicate endpoint cleanup.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 1 — REPLICA IDENTITY FULL (selective)
-- Apply FULL only where Realtime UPDATE/DELETE filters need old + new row values.
-- Skip high-volume INSERT-primary tables to avoid unnecessary WAL growth.
-- Idempotent: ALTER … REPLICA IDENTITY FULL is a no-op when already FULL.
-- ---------------------------------------------------------------------------
do $$
begin
  -- offers: status / amount / counter chain UPDATE + DELETE; clients filter by
  -- buyer_id, seller_id, conversation_id — FULL required for filtered UPDATE/DELETE.
  if to_regclass('public.offers') is not null then
    execute 'alter table public.offers replica identity full';
  end if;

  -- orders: lifecycle UPDATE (paid, shipped, completed); filters on buyer/seller —
  -- FULL required so old row remains available under Realtime filters.
  if to_regclass('public.orders') is not null then
    execute 'alter table public.orders replica identity full';
  end if;

  -- products: listing price / status / stock UPDATE; seller and slug filters —
  -- FULL required for filtered UPDATE/DELETE.
  if to_regclass('public.products') is not null then
    execute 'alter table public.products replica identity full';
  end if;

  -- reviews: UPDATE/DELETE with filters on subject / order — FULL required.
  if to_regclass('public.reviews') is not null then
    execute 'alter table public.reviews replica identity full';
  end if;

  -- wallets: balance UPDATE filtered by user_id (not PK alone for payload filters) —
  -- FULL required.
  if to_regclass('public.wallets') is not null then
    execute 'alter table public.wallets replica identity full';
  end if;

  -- user_follows: unfollow = DELETE with follower/following filters — FULL required
  -- so DELETE payloads include filter columns.
  if to_regclass('public.user_follows') is not null then
    execute 'alter table public.user_follows replica identity full';
  end if;

  -- protection_cases: dispute lifecycle UPDATE — FULL required.
  if to_regclass('public.protection_cases') is not null then
    execute 'alter table public.protection_cases replica identity full';
  end if;

  -- bundle_offers: negotiation status UPDATE like offers — FULL required.
  if to_regclass('public.bundle_offers') is not null then
    execute 'alter table public.bundle_offers replica identity full';
  end if;

  -- messages: intentionally NOT set to FULL here.
  -- Reason: INSERT-dominant, very high WAL volume; Realtime filters use
  -- conversation_id which does not change on read/UPDATE. DEFAULT is sufficient.

  -- conversations: intentionally NOT set to FULL here.
  -- Reason: high-frequency unread/last_activity UPDATE; filter keys (buyer_id /
  -- seller_id) are immutable. DEFAULT avoids extra WAL.

  -- notifications: intentionally NOT set to FULL here.
  -- Reason: INSERT + read flag UPDATE; filter key user_id is immutable. DEFAULT OK.

  -- wallet_transactions: intentionally NOT set to FULL here.
  -- Reason: append-only ledger (INSERT primary). DEFAULT is sufficient for INSERT
  -- Realtime; avoids FULL WAL cost on every ledger write.
end $$;

-- ---------------------------------------------------------------------------
-- SECTION 2 — PUBLICATION supabase_realtime
-- For each required table:
--   1) skip if relation missing
--   2) skip if already in pg_publication_tables
--   3) ALTER PUBLICATION ADD TABLE
-- Catch expected errors (duplicate_object, insufficient_privilege) and CONTINUE.
-- Unexpected errors still RAISE (fail migration).
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'messages',
    'conversations',
    'notifications',
    'bundle_offers',
    'offers',
    'orders',
    'products',
    'reviews',
    'user_follows',
    'wallets',
    'wallet_transactions',
    'protection_cases'
  ];
begin
  foreach t in array tables
  loop
    begin
      if to_regclass('public.' || t) is null then
        raise notice 'ROVEXO realtime: skip missing table public.%', t;
        continue;
      end if;

      if exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = t
      ) then
        raise notice 'ROVEXO realtime: already published public.%', t;
        continue;
      end if;

      execute format(
        'alter publication supabase_realtime add table public.%I',
        t
      );
      raise notice 'ROVEXO realtime: published public.%', t;
    exception
      when duplicate_object then
        -- Already a member / concurrent add — continue safely
        raise notice 'ROVEXO realtime: duplicate_object on public.% — continued', t;
      when insufficient_privilege then
        -- Role cannot alter publication — continue other tables
        raise notice 'ROVEXO realtime: insufficient_privilege on public.% — continued', t;
      when others then
        -- Unexpected: fail the migration
        raise;
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- SECTION 3 — PUSH ENDPOINT OWNERSHIP (ROW_NUMBER dedupe + unique index)
-- One endpoint → one user. Keep newest row per endpoint; tie-break by highest id.
-- Deletes only duplicate rows (not the surviving owner row). Idempotent.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.push_subscriptions') is null then
    raise notice 'ROVEXO push: public.push_subscriptions missing — skip endpoint ownership';
    return;
  end if;

  -- Deterministic dedupe: partition by endpoint, keep rn = 1
  delete from public.push_subscriptions ps
  where ps.id in (
    select ranked.id
    from (
      select
        id,
        row_number() over (
          partition by endpoint
          order by created_at desc nulls last, id desc
        ) as rn
      from public.push_subscriptions
    ) ranked
    where ranked.rn > 1
  );

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'push_subscriptions_endpoint_uidx'
  ) then
    create unique index push_subscriptions_endpoint_uidx
      on public.push_subscriptions (endpoint);
    raise notice 'ROVEXO push: created push_subscriptions_endpoint_uidx';
  else
    raise notice 'ROVEXO push: push_subscriptions_endpoint_uidx already exists';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- SECTION 4 — POST-MIGRATION VERIFICATION (read-only)
-- Prints publication members, replica identity, and unique endpoint index status.
-- ---------------------------------------------------------------------------

-- Published realtime tables (required set)
select
  t.tablename as realtime_table,
  case
    when p.tablename is not null then 'PUBLISHED'
    when to_regclass('public.' || t.tablename) is null then 'TABLE_MISSING'
    else 'NOT_PUBLISHED'
  end as publication_status
from (
  values
    ('messages'),
    ('conversations'),
    ('notifications'),
    ('bundle_offers'),
    ('offers'),
    ('orders'),
    ('products'),
    ('reviews'),
    ('user_follows'),
    ('wallets'),
    ('wallet_transactions'),
    ('protection_cases')
) as t(tablename)
left join pg_publication_tables p
  on p.pubname = 'supabase_realtime'
 and p.schemaname = 'public'
 and p.tablename = t.tablename
order by t.tablename;

-- Replica identity status (FULL expected only on selective set)
select
  t.tablename as replica_table,
  case c.relreplident
    when 'd' then 'DEFAULT'
    when 'n' then 'NOTHING'
    when 'f' then 'FULL'
    when 'i' then 'INDEX'
    else 'MISSING_OR_UNKNOWN'
  end as replica_identity,
  case
    when t.tablename in (
      'offers',
      'orders',
      'products',
      'reviews',
      'wallets',
      'user_follows',
      'protection_cases',
      'bundle_offers'
    ) then 'EXPECT_FULL'
    else 'EXPECT_DEFAULT_OR_UNCHANGED'
  end as policy
from (
  values
    ('messages'),
    ('conversations'),
    ('notifications'),
    ('bundle_offers'),
    ('offers'),
    ('orders'),
    ('products'),
    ('reviews'),
    ('user_follows'),
    ('wallets'),
    ('wallet_transactions'),
    ('protection_cases')
) as t(tablename)
left join pg_class c
  on c.oid = to_regclass('public.' || t.tablename)
left join pg_namespace n
  on n.oid = c.relnamespace
 and n.nspname = 'public'
order by t.tablename;

-- Unique endpoint index status
select
  'push_subscriptions_endpoint_uidx' as index_name,
  case
    when exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and indexname = 'push_subscriptions_endpoint_uidx'
    ) then 'EXISTS'
    else 'MISSING'
  end as index_status;

-- ROVEXO REALTIME FOUNDATION P0 COMPLETE
