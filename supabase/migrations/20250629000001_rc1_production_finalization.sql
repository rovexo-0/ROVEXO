-- RC1 production finalization: saved search notifications, promotion scheduling, follower sync

alter table public.saved_searches
  add column if not exists notify_enabled boolean not null default true,
  add column if not exists last_notified_at timestamptz;

create table if not exists public.saved_search_notification_log (
  id uuid primary key default gen_random_uuid(),
  saved_search_id uuid not null references public.saved_searches (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  notified_at timestamptz not null default now(),
  unique (saved_search_id, product_id)
);

create index if not exists saved_search_notification_log_search_idx
  on public.saved_search_notification_log (saved_search_id, notified_at desc);

alter table public.saved_search_notification_log enable row level security;

do $$
begin
  alter type public.notification_type add value if not exists 'saved_search_match';
exception
  when duplicate_object then null;
end $$;

alter table public.listing_promotions drop constraint if exists listing_promotions_status_check;
alter table public.listing_promotions add constraint listing_promotions_status_check
  check (status in ('pending', 'active', 'scheduled', 'expired', 'failed', 'suspended'));

create or replace function public.sync_seller_follower_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.seller_profiles
    set follower_count = follower_count + 1
    where id = new.seller_id;
  elsif tg_op = 'DELETE' then
    update public.seller_profiles
    set follower_count = greatest(follower_count - 1, 0)
    where id = old.seller_id;
  end if;
  return null;
end;
$$;

drop trigger if exists seller_follows_sync_count on public.seller_follows;
create trigger seller_follows_sync_count
  after insert or delete on public.seller_follows
  for each row execute function public.sync_seller_follower_count();
