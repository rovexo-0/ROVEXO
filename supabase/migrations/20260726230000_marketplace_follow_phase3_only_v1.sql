-- ROVEXO Phase 3 — Marketplace Follow ONLY
-- Applies user_follows + counters. Does NOT touch orders / payments / auth.

create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  notify_new_listings boolean not null default true,
  notify_price_drops boolean not null default true,
  notify_sold_items boolean not null default false,
  notify_user_returns boolean not null default false,
  notify_new_reviews boolean not null default true,
  notify_verified_badge boolean not null default true,
  notify_vacation_off boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_follows_no_self check (follower_id <> following_id),
  constraint user_follows_unique unique (follower_id, following_id)
);

create index if not exists user_follows_follower_idx
  on public.user_follows (follower_id, created_at desc);

create index if not exists user_follows_following_idx
  on public.user_follows (following_id, created_at desc);

alter table public.profiles
  add column if not exists follower_count integer not null default 0,
  add column if not exists following_count integer not null default 0;

create or replace function public.sync_user_follow_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
      set follower_count = greatest(0, follower_count + 1), updated_at = now()
      where id = new.following_id;
    update public.profiles
      set following_count = greatest(0, following_count + 1), updated_at = now()
      where id = new.follower_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.profiles
      set follower_count = greatest(0, follower_count - 1), updated_at = now()
      where id = old.following_id;
    update public.profiles
      set following_count = greatest(0, following_count - 1), updated_at = now()
      where id = old.follower_id;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists user_follows_sync_counts on public.user_follows;
create trigger user_follows_sync_counts
  after insert or delete on public.user_follows
  for each row execute function public.sync_user_follow_counts();

alter table public.user_follows enable row level security;

drop policy if exists "user_follows_select_public" on public.user_follows;
create policy "user_follows_select_public"
  on public.user_follows for select
  using (true);

drop policy if exists "user_follows_insert_own" on public.user_follows;
create policy "user_follows_insert_own"
  on public.user_follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "user_follows_update_own" on public.user_follows;
create policy "user_follows_update_own"
  on public.user_follows for update
  using (auth.uid() = follower_id)
  with check (auth.uid() = follower_id);

drop policy if exists "user_follows_delete_own" on public.user_follows;
create policy "user_follows_delete_own"
  on public.user_follows for delete
  using (auth.uid() = follower_id);

comment on table public.user_follows is
  'Phase 3 marketplace Follow — relationship SSOT. Not social media.';

-- Reload PostgREST schema cache so user_follows is visible (clears PGRST205).
notify pgrst, 'reload schema';
