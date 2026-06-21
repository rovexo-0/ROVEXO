-- Phase 3: Realtime chat enhancements

alter table public.conversations
  add column if not exists buyer_archived boolean not null default false,
  add column if not exists seller_archived boolean not null default false,
  add column if not exists buyer_muted boolean not null default false,
  add column if not exists seller_muted boolean not null default false,
  add column if not exists buyer_pinned boolean not null default false,
  add column if not exists seller_pinned boolean not null default false,
  add column if not exists buyer_blocked boolean not null default false,
  add column if not exists seller_blocked boolean not null default false;

alter table public.messages
  add column if not exists reply_to_id uuid references public.messages (id) on delete set null,
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists reactions jsonb not null default '{}'::jsonb,
  add column if not exists delivered_at timestamptz;

create table if not exists public.user_presence (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  online boolean not null default false,
  last_seen_at timestamptz not null default now(),
  typing_conversation_id uuid references public.conversations (id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists user_presence_online_idx on public.user_presence (online, updated_at desc);

create table if not exists public.conversation_reports (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);

alter table public.user_presence enable row level security;
alter table public.conversation_reports enable row level security;

drop policy if exists "user_presence_select_participants" on public.user_presence;
create policy "user_presence_select_participants"
  on public.user_presence for select
  to authenticated
  using (true);

drop policy if exists "user_presence_upsert_self" on public.user_presence;
create policy "user_presence_upsert_self"
  on public.user_presence for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "conversation_reports_insert_participant" on public.conversation_reports;
create policy "conversation_reports_insert_participant"
  on public.conversation_reports for insert
  to authenticated
  with check (
    auth.uid() = reporter_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

drop policy if exists "conversation_reports_select_own" on public.conversation_reports;
create policy "conversation_reports_select_own"
  on public.conversation_reports for select
  to authenticated
  using (auth.uid() = reporter_id or public.is_admin());

alter publication supabase_realtime add table public.user_presence;
