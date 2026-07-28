-- ROVEXO v1.0 — Social Follow System Permanent Removal (CEO)
-- Drops seller_follows and follower sync trigger. No Follow tables remain.

drop trigger if exists seller_follows_sync_count on public.seller_follows;
drop function if exists public.sync_seller_follower_count() cascade;

drop policy if exists "seller_follows_select_own" on public.seller_follows;
drop policy if exists "seller_follows_insert_own" on public.seller_follows;
drop policy if exists "seller_follows_delete_own" on public.seller_follows;

drop table if exists public.seller_follows cascade;

-- Optional counters no longer used by product UI
alter table if exists public.seller_profiles
  drop column if exists follower_count;
