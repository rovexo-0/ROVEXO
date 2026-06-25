-- Pass 6: Launch readiness — saved searches, recently viewed, seller follows

create table if not exists public.recently_viewed (
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create index if not exists recently_viewed_user_idx on public.recently_viewed (user_id, viewed_at desc);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  query text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saved_searches_user_idx on public.saved_searches (user_id, updated_at desc);

create table if not exists public.seller_follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, seller_id),
  constraint seller_follows_not_self check (follower_id <> seller_id)
);

create index if not exists seller_follows_seller_idx on public.seller_follows (seller_id, created_at desc);

alter table public.recently_viewed enable row level security;
alter table public.saved_searches enable row level security;
alter table public.seller_follows enable row level security;

drop policy if exists "recently_viewed_select_own" on public.recently_viewed;
create policy "recently_viewed_select_own" on public.recently_viewed for select using (auth.uid() = user_id);
drop policy if exists "recently_viewed_insert_own" on public.recently_viewed;
create policy "recently_viewed_insert_own" on public.recently_viewed for insert with check (auth.uid() = user_id);
drop policy if exists "recently_viewed_update_own" on public.recently_viewed;
create policy "recently_viewed_update_own" on public.recently_viewed for update using (auth.uid() = user_id);
drop policy if exists "recently_viewed_delete_own" on public.recently_viewed;
create policy "recently_viewed_delete_own" on public.recently_viewed for delete using (auth.uid() = user_id);

drop policy if exists "saved_searches_select_own" on public.saved_searches;
create policy "saved_searches_select_own" on public.saved_searches for select using (auth.uid() = user_id);
drop policy if exists "saved_searches_insert_own" on public.saved_searches;
create policy "saved_searches_insert_own" on public.saved_searches for insert with check (auth.uid() = user_id);
drop policy if exists "saved_searches_update_own" on public.saved_searches;
create policy "saved_searches_update_own" on public.saved_searches for update using (auth.uid() = user_id);
drop policy if exists "saved_searches_delete_own" on public.saved_searches;
create policy "saved_searches_delete_own" on public.saved_searches for delete using (auth.uid() = user_id);

drop policy if exists "seller_follows_select_own" on public.seller_follows;
create policy "seller_follows_select_own" on public.seller_follows for select using (auth.uid() = follower_id);
drop policy if exists "seller_follows_insert_own" on public.seller_follows;
create policy "seller_follows_insert_own" on public.seller_follows for insert with check (auth.uid() = follower_id);
drop policy if exists "seller_follows_delete_own" on public.seller_follows;
create policy "seller_follows_delete_own" on public.seller_follows for delete using (auth.uid() = follower_id);

drop trigger if exists "saved_searches_set_updated_at" on public.saved_searches;
create trigger saved_searches_set_updated_at
  before update on public.saved_searches
  for each row execute function public.set_updated_at();
