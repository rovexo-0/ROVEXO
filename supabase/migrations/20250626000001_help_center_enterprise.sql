-- Enterprise Help Center: analytics, CMS tables, support context

create table if not exists public.help_analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  topic_slug text,
  article_slug text,
  solution_id text,
  search_query text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists help_analytics_events_type_idx on public.help_analytics_events (event_type, created_at desc);
create index if not exists help_analytics_events_topic_idx on public.help_analytics_events (topic_slug, created_at desc);

create table if not exists public.help_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  description text not null default '',
  icon text not null default '❓',
  group_name text not null default 'General',
  keywords text[] not null default '{}',
  visible boolean not null default true,
  search_ranking integer not null default 0,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.help_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  topic_slug text not null,
  summary text not null default '',
  content text not null default '',
  keywords text[] not null default '{}',
  status text not null default 'published',
  locale text not null default 'en',
  pinned boolean not null default false,
  search_ranking integer not null default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.help_decision_trees (
  id uuid primary key default gen_random_uuid(),
  topic_slug text not null unique,
  title text not null,
  tree jsonb not null,
  status text not null default 'published',
  locale text not null default 'en',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.help_faqs (
  id uuid primary key default gen_random_uuid(),
  topic_slug text not null,
  question text not null,
  answer text not null,
  keywords text[] not null default '{}',
  visible boolean not null default true,
  locale text not null default 'en',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.help_article_versions (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.help_articles(id) on delete cascade,
  version integer not null,
  title text not null,
  content text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.support_tickets
  add column if not exists help_context jsonb not null default '{}'::jsonb;

alter table public.help_analytics_events enable row level security;
alter table public.help_categories enable row level security;
alter table public.help_articles enable row level security;
alter table public.help_decision_trees enable row level security;
alter table public.help_faqs enable row level security;
alter table public.help_article_versions enable row level security;

drop policy if exists "help_analytics_insert" on public.help_analytics_events;
create policy "help_analytics_insert"
  on public.help_analytics_events for insert
  to authenticated, anon
  with check (true);

drop policy if exists "help_analytics_admin_read" on public.help_analytics_events;
create policy "help_analytics_admin_read"
  on public.help_analytics_events for select
  to authenticated
  using (public.is_admin());

drop policy if exists "help_categories_public_read" on public.help_categories;
create policy "help_categories_public_read"
  on public.help_categories for select
  to authenticated, anon
  using (visible = true);

drop policy if exists "help_categories_admin_all" on public.help_categories;
create policy "help_categories_admin_all"
  on public.help_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "help_articles_public_read" on public.help_articles;
create policy "help_articles_public_read"
  on public.help_articles for select
  to authenticated, anon
  using (status = 'published');

drop policy if exists "help_articles_admin_all" on public.help_articles;
create policy "help_articles_admin_all"
  on public.help_articles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "help_trees_public_read" on public.help_decision_trees;
create policy "help_trees_public_read"
  on public.help_decision_trees for select
  to authenticated, anon
  using (status = 'published');

drop policy if exists "help_trees_admin_all" on public.help_decision_trees;
create policy "help_trees_admin_all"
  on public.help_decision_trees for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "help_faqs_public_read" on public.help_faqs;
create policy "help_faqs_public_read"
  on public.help_faqs for select
  to authenticated, anon
  using (visible = true);

drop policy if exists "help_faqs_admin_all" on public.help_faqs;
create policy "help_faqs_admin_all"
  on public.help_faqs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "help_article_versions_admin_all" on public.help_article_versions;
create policy "help_article_versions_admin_all"
  on public.help_article_versions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists help_categories_updated_at on public.help_categories;
create trigger help_categories_updated_at before update on public.help_categories
  for each row execute function public.set_updated_at();

drop trigger if exists help_articles_updated_at on public.help_articles;
create trigger help_articles_updated_at before update on public.help_articles
  for each row execute function public.set_updated_at();

drop trigger if exists help_decision_trees_updated_at on public.help_decision_trees;
create trigger help_decision_trees_updated_at before update on public.help_decision_trees
  for each row execute function public.set_updated_at();

drop trigger if exists help_faqs_updated_at on public.help_faqs;
create trigger help_faqs_updated_at before update on public.help_faqs
  for each row execute function public.set_updated_at();
