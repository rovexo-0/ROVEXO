-- ROVEXO v1.0 — Promotion Engine admin columns, audit expansion, realtime

alter table public.listing_promotions
  add column if not exists source text not null default 'purchased'
    check (source in (
      'purchased', 'granted_by_rovexo', 'compensation', 'launch_campaign',
      'support', 'marketing', 'beta_testing', 'internal'
    )),
  add column if not exists paused_at timestamptz,
  add column if not exists reason text;

alter table public.seller_promotions
  add column if not exists source text not null default 'purchased'
    check (source in (
      'purchased', 'granted_by_rovexo', 'compensation', 'launch_campaign',
      'support', 'marketing', 'beta_testing', 'internal'
    )),
  add column if not exists paused_at timestamptz;

alter table public.promotion_action_audit
  add column if not exists store_id uuid references public.profiles (id) on delete set null,
  add column if not exists promotion_source text,
  add column if not exists activation_date timestamptz,
  add column if not exists expiration_date timestamptz,
  add column if not exists actor_name text,
  add column if not exists ip_address text;

-- Realtime publication for promotion synchronization
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'listing_promotions'
  ) then
    alter publication supabase_realtime add table public.listing_promotions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'seller_promotions'
  ) then
    alter publication supabase_realtime add table public.seller_promotions;
  end if;
end $$;
