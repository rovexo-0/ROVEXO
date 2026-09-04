-- ROVEXO Business Switch — reversible seller_context preference
-- Additive / backwards-compatible. Does NOT delete Business, Store, listings,
-- Stripe Connect, or verification. Individual sellers remain individual.

alter table public.seller_profiles
  add column if not exists active_seller_context text;

update public.seller_profiles
set active_seller_context = 'individual'
where active_seller_context is null;

alter table public.seller_profiles
  alter column active_seller_context set default 'individual';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'seller_profiles_active_seller_context_check'
  ) then
    alter table public.seller_profiles
      add constraint seller_profiles_active_seller_context_check
      check (active_seller_context in ('individual', 'business'));
  end if;
end $$;

alter table public.seller_profiles
  alter column active_seller_context set not null;

comment on column public.seller_profiles.active_seller_context is
  'UI/wallet seller context preference: individual | business. Switching never deletes Business data, Store, listings, Stripe, or verification. Distinct from immutable orders.seller_context.';

create index if not exists seller_profiles_active_seller_context_idx
  on public.seller_profiles (active_seller_context);
