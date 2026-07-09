-- ROVEXO Ideas v2.1 — private user suggestions for platform improvement

create table if not exists public.rovexo_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  body text not null,
  screenshot_url text,
  status text not null default 'new',
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rovexo_ideas_subject_length check (char_length(subject) between 3 and 200),
  constraint rovexo_ideas_body_length check (char_length(body) between 10 and 5000),
  constraint rovexo_ideas_status_check check (
    status in ('new', 'under_review', 'planned', 'in_development', 'implemented', 'closed')
  )
);

create index if not exists rovexo_ideas_user_id_idx on public.rovexo_ideas (user_id);
create index if not exists rovexo_ideas_status_idx on public.rovexo_ideas (status);
create index if not exists rovexo_ideas_created_at_idx on public.rovexo_ideas (created_at desc);

drop trigger if exists rovexo_ideas_updated_at on public.rovexo_ideas;
create trigger rovexo_ideas_updated_at before update on public.rovexo_ideas
  for each row execute function public.set_updated_at();

alter table public.rovexo_ideas enable row level security;

drop policy if exists "rovexo_ideas_insert_own" on public.rovexo_ideas;
create policy "rovexo_ideas_insert_own"
  on public.rovexo_ideas for insert
  with check (auth.uid() = user_id);

drop policy if exists "rovexo_ideas_super_admin_all" on public.rovexo_ideas;
create policy "rovexo_ideas_super_admin_all"
  on public.rovexo_ideas for all
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

grant select, insert on public.rovexo_ideas to authenticated;
grant all on public.rovexo_ideas to service_role;
