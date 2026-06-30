-- Pass 7: Production operations — error logging and cron run history

create table if not exists public.platform_error_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'error' check (level in ('info', 'warn', 'error')),
  category text not null,
  message text not null,
  context jsonb not null default '{}'::jsonb,
  stack_trace text,
  created_at timestamptz not null default now()
);

create index if not exists platform_error_logs_created_idx
  on public.platform_error_logs (created_at desc);

create index if not exists platform_error_logs_category_idx
  on public.platform_error_logs (category, created_at desc);

create table if not exists public.cron_job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null check (status in ('success', 'failed')),
  result jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists cron_job_runs_started_idx
  on public.cron_job_runs (started_at desc);

alter table public.platform_error_logs enable row level security;
alter table public.cron_job_runs enable row level security;

drop policy if exists "platform_error_logs_admin" on public.platform_error_logs;
create policy "platform_error_logs_admin"
  on public.platform_error_logs for select
  using (public.is_admin());

drop policy if exists "cron_job_runs_admin" on public.cron_job_runs;
create policy "cron_job_runs_admin"
  on public.cron_job_runs for select
  using (public.is_admin());
