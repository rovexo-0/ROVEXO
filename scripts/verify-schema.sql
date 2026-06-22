-- Run against production Supabase after applying migrations 001–008.
-- Expected: zero rows returned for each verification query.

-- Migration files (apply in order):
-- 001 foundation_schema
-- 002 rls_policies
-- 003 storage
-- 004 seed_categories
-- 005 seller_listings
-- 006 bump_system
-- 007 product_select_grants
-- 008 auth_email_verified_sync
-- 009 categories_select_grants
-- 010 listing_promotions
-- 011 production_security
-- 012 commerce_production
-- 013 promotion_checkout_hardening
-- 014 production_blockers

-- Core commerce columns (migration 006 + 008)
select 'missing orders.stripe_refund_id' as issue
where not exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'orders' and column_name = 'stripe_refund_id'
)
union all
select 'missing orders.refunded_at'
where not exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'orders' and column_name = 'refunded_at'
)
union all
select 'missing wallet_transactions.stripe_transfer_id'
where not exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'wallet_transactions' and column_name = 'stripe_transfer_id'
)
union all
select 'missing email_outbox.retry_count'
where not exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'email_outbox' and column_name = 'retry_count'
)
union all
select 'missing cart_items table'
where not exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'cart_items'
)
union all
select 'missing create_order_review function'
where not exists (
  select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'create_order_review'
)
union all
select 'missing refresh_seller_rating function'
where not exists (
  select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'refresh_seller_rating'
);

-- RLS enabled on sensitive tables
select tablename || ' RLS disabled' as issue
from pg_tables t
join pg_class c on c.relname = t.tablename
where t.schemaname = 'public'
  and t.tablename in (
    'orders', 'reviews', 'wallets', 'wallet_transactions',
    'cart_items', 'email_outbox', 'listing_promotions'
  )
  and c.relrowsecurity = false;

-- Phase 8 + Pass 6 + RC1 tables
select 'missing saved_searches table' as issue
where not exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'saved_searches'
)
union all
select 'missing recently_viewed table'
where not exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'recently_viewed'
)
union all
select 'missing seller_follows table'
where not exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'seller_follows'
)
union all
select 'missing monetization_plans table'
where not exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'monetization_plans'
)
union all
select 'missing platform_analytics_events table'
where not exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'platform_analytics_events'
)
union all
select 'missing saved_search_notification_log table'
where not exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'saved_search_notification_log'
)
union all
select 'missing platform_error_logs table'
where not exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'platform_error_logs'
)
union all
select 'missing cron_job_runs table'
where not exists (
  select 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'cron_job_runs'
);
