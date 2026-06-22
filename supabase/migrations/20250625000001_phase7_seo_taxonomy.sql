-- Phase 7: SEO redirects and multi-market readiness

create table if not exists public.seo_redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null unique,
  target_path text not null,
  status_code integer not null default 301,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seo_redirects_source_idx on public.seo_redirects (source_path) where active = true;

create table if not exists public.market_regions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  locale text not null,
  currency text not null,
  active boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.market_regions (code, name, locale, currency, active, sort_order)
values ('uk', 'United Kingdom', 'en-GB', 'GBP', true, 1)
on conflict (code) do nothing;

insert into public.market_regions (code, name, locale, currency, active, sort_order)
values
  ('ie', 'Ireland', 'en-IE', 'EUR', false, 2),
  ('de', 'Germany', 'de-DE', 'EUR', false, 3),
  ('fr', 'France', 'fr-FR', 'EUR', false, 4),
  ('es', 'Spain', 'es-ES', 'EUR', false, 5),
  ('it', 'Italy', 'it-IT', 'EUR', false, 6),
  ('ro', 'Romania', 'ro-RO', 'RON', false, 7),
  ('nl', 'Netherlands', 'nl-NL', 'EUR', false, 8),
  ('be', 'Belgium', 'nl-BE', 'EUR', false, 9)
on conflict (code) do nothing;

insert into public.seo_redirects (source_path, target_path, status_code)
select '/cars', '/browse/cars', 301
where not exists (select 1 from public.seo_redirects where source_path = '/cars');

insert into public.seo_redirects (source_path, target_path, status_code)
select '/phones', '/browse/phones', 301
where not exists (select 1 from public.seo_redirects where source_path = '/phones');

drop trigger if exists seo_redirects_updated_at on public.seo_redirects;
create trigger seo_redirects_updated_at before update on public.seo_redirects
  for each row execute function public.set_updated_at();

alter table public.seo_redirects enable row level security;
alter table public.market_regions enable row level security;

drop policy if exists "seo_redirects_public_read" on public.seo_redirects;
create policy "seo_redirects_public_read"
  on public.seo_redirects for select
  to authenticated, anon
  using (active = true);

drop policy if exists "seo_redirects_admin_all" on public.seo_redirects;
create policy "seo_redirects_admin_all"
  on public.seo_redirects for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "market_regions_public_read" on public.market_regions;
create policy "market_regions_public_read"
  on public.market_regions for select
  to authenticated, anon
  using (true);

drop policy if exists "market_regions_admin_all" on public.market_regions;
create policy "market_regions_admin_all"
  on public.market_regions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
