-- ROVEXO Ideas Community v1.0 — Owner mockup SSOT
-- Votes · Comments · Follows · Developer Updates · category · counters · community RLS

alter table public.rovexo_ideas
  add column if not exists category text not null default 'Buying',
  add column if not exists like_count integer not null default 0,
  add column if not exists dislike_count integer not null default 0,
  add column if not exists comment_count integer not null default 0,
  add column if not exists follow_count integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'rovexo_ideas_category_check'
  ) then
    alter table public.rovexo_ideas
      add constraint rovexo_ideas_category_check check (
        category in (
          'Buying',
          'Selling',
          'Payments',
          'Shipping',
          'Account',
          'Search',
          'Other'
        )
      );
  end if;
end $$;

create table if not exists public.rovexo_idea_votes (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.rovexo_ideas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  vote text not null check (vote in ('like', 'dislike')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idea_id, user_id)
);

create index if not exists rovexo_idea_votes_idea_id_idx on public.rovexo_idea_votes (idea_id);
create index if not exists rovexo_idea_votes_user_id_idx on public.rovexo_idea_votes (user_id);

create table if not exists public.rovexo_idea_comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.rovexo_ideas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rovexo_idea_comments_body_length check (char_length(body) between 1 and 2000)
);

create index if not exists rovexo_idea_comments_idea_id_idx
  on public.rovexo_idea_comments (idea_id, created_at desc);

create table if not exists public.rovexo_idea_follows (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.rovexo_ideas (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (idea_id, user_id)
);

create index if not exists rovexo_idea_follows_idea_id_idx on public.rovexo_idea_follows (idea_id);
create index if not exists rovexo_idea_follows_user_id_idx on public.rovexo_idea_follows (user_id);

create table if not exists public.rovexo_idea_updates (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.rovexo_ideas (id) on delete cascade,
  status text not null,
  message text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint rovexo_idea_updates_status_check check (
    status in ('new', 'under_review', 'planned', 'in_development', 'implemented', 'closed')
  )
);

create index if not exists rovexo_idea_updates_idea_id_idx
  on public.rovexo_idea_updates (idea_id, created_at desc);

-- Counter maintenance
create or replace function public.rovexo_ideas_refresh_vote_counts(p_idea_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.rovexo_ideas i
  set
    like_count = (select count(*)::integer from public.rovexo_idea_votes v where v.idea_id = p_idea_id and v.vote = 'like'),
    dislike_count = (select count(*)::integer from public.rovexo_idea_votes v where v.idea_id = p_idea_id and v.vote = 'dislike'),
    updated_at = now()
  where i.id = p_idea_id;
end;
$$;

create or replace function public.rovexo_ideas_on_vote_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.rovexo_ideas_refresh_vote_counts(coalesce(new.idea_id, old.idea_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists rovexo_idea_votes_refresh on public.rovexo_idea_votes;
create trigger rovexo_idea_votes_refresh
  after insert or update or delete on public.rovexo_idea_votes
  for each row execute function public.rovexo_ideas_on_vote_change();

create or replace function public.rovexo_ideas_on_comment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  target := coalesce(new.idea_id, old.idea_id);
  update public.rovexo_ideas
  set comment_count = (
    select count(*)::integer from public.rovexo_idea_comments c where c.idea_id = target
  ),
  updated_at = now()
  where id = target;
  return coalesce(new, old);
end;
$$;

drop trigger if exists rovexo_idea_comments_refresh on public.rovexo_idea_comments;
create trigger rovexo_idea_comments_refresh
  after insert or update or delete on public.rovexo_idea_comments
  for each row execute function public.rovexo_ideas_on_comment_change();

create or replace function public.rovexo_ideas_on_follow_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  target := coalesce(new.idea_id, old.idea_id);
  update public.rovexo_ideas
  set follow_count = (
    select count(*)::integer from public.rovexo_idea_follows f where f.idea_id = target
  ),
  updated_at = now()
  where id = target;
  return coalesce(new, old);
end;
$$;

drop trigger if exists rovexo_idea_follows_refresh on public.rovexo_idea_follows;
create trigger rovexo_idea_follows_refresh
  after insert or delete on public.rovexo_idea_follows
  for each row execute function public.rovexo_ideas_on_follow_change();

-- Auto timeline row when status changes
create or replace function public.rovexo_ideas_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.rovexo_idea_updates (idea_id, status, message, created_by)
    values (
      new.id,
      new.status,
      case new.status
        when 'new' then 'Idea submitted and waiting for review.'
        when 'under_review' then 'Our team is reviewing this suggestion.'
        when 'planned' then 'We are planning how to implement this.'
        when 'in_development' then 'Our developers are working on this!'
        when 'implemented' then 'This idea has been released.'
        when 'closed' then 'This idea was declined.'
        else ''
      end,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists rovexo_ideas_status_timeline on public.rovexo_ideas;
create trigger rovexo_ideas_status_timeline
  after update of status on public.rovexo_ideas
  for each row execute function public.rovexo_ideas_on_status_change();

-- RLS
alter table public.rovexo_idea_votes enable row level security;
alter table public.rovexo_idea_comments enable row level security;
alter table public.rovexo_idea_follows enable row level security;
alter table public.rovexo_idea_updates enable row level security;

drop policy if exists "rovexo_ideas_select_authenticated" on public.rovexo_ideas;
create policy "rovexo_ideas_select_authenticated"
  on public.rovexo_ideas for select
  to authenticated
  using (true);

drop policy if exists "rovexo_idea_votes_select" on public.rovexo_idea_votes;
create policy "rovexo_idea_votes_select"
  on public.rovexo_idea_votes for select to authenticated using (true);

drop policy if exists "rovexo_idea_votes_insert_own" on public.rovexo_idea_votes;
create policy "rovexo_idea_votes_insert_own"
  on public.rovexo_idea_votes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "rovexo_idea_votes_update_own" on public.rovexo_idea_votes;
create policy "rovexo_idea_votes_update_own"
  on public.rovexo_idea_votes for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "rovexo_idea_votes_delete_own" on public.rovexo_idea_votes;
create policy "rovexo_idea_votes_delete_own"
  on public.rovexo_idea_votes for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "rovexo_idea_comments_select" on public.rovexo_idea_comments;
create policy "rovexo_idea_comments_select"
  on public.rovexo_idea_comments for select to authenticated using (true);

drop policy if exists "rovexo_idea_comments_insert_own" on public.rovexo_idea_comments;
create policy "rovexo_idea_comments_insert_own"
  on public.rovexo_idea_comments for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "rovexo_idea_comments_update_own" on public.rovexo_idea_comments;
create policy "rovexo_idea_comments_update_own"
  on public.rovexo_idea_comments for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "rovexo_idea_comments_delete_own" on public.rovexo_idea_comments;
create policy "rovexo_idea_comments_delete_own"
  on public.rovexo_idea_comments for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "rovexo_idea_follows_select" on public.rovexo_idea_follows;
create policy "rovexo_idea_follows_select"
  on public.rovexo_idea_follows for select to authenticated using (true);

drop policy if exists "rovexo_idea_follows_insert_own" on public.rovexo_idea_follows;
create policy "rovexo_idea_follows_insert_own"
  on public.rovexo_idea_follows for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "rovexo_idea_follows_delete_own" on public.rovexo_idea_follows;
create policy "rovexo_idea_follows_delete_own"
  on public.rovexo_idea_follows for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "rovexo_idea_updates_select" on public.rovexo_idea_updates;
create policy "rovexo_idea_updates_select"
  on public.rovexo_idea_updates for select to authenticated using (true);

drop policy if exists "rovexo_idea_updates_admin_write" on public.rovexo_idea_updates;
create policy "rovexo_idea_updates_admin_write"
  on public.rovexo_idea_updates for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'::public.user_role
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'::public.user_role
    )
  );

grant select, insert, update, delete on public.rovexo_idea_votes to authenticated;
grant select, insert, update, delete on public.rovexo_idea_comments to authenticated;
grant select, insert, delete on public.rovexo_idea_follows to authenticated;
grant select on public.rovexo_idea_updates to authenticated;
grant all on public.rovexo_idea_votes to service_role;
grant all on public.rovexo_idea_comments to service_role;
grant all on public.rovexo_idea_follows to service_role;
grant all on public.rovexo_idea_updates to service_role;
