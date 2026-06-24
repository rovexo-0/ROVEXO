-- Auctions v1.1 launch notification sign-ups (v1.0 coming soon page)

create table if not exists public.auction_launch_subscribers (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists auction_launch_subscribers_created_idx
  on public.auction_launch_subscribers (created_at desc);

alter table public.auction_launch_subscribers enable row level security;

drop policy if exists "auction_launch_subscribers_self_select" on public.auction_launch_subscribers;
create policy "auction_launch_subscribers_self_select"
  on public.auction_launch_subscribers for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "auction_launch_subscribers_self_insert" on public.auction_launch_subscribers;
create policy "auction_launch_subscribers_self_insert"
  on public.auction_launch_subscribers for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.auction_launch_subscribers to authenticated;
