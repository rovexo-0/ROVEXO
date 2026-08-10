-- ============================================================================
-- ROVEXO — Homepage Registered User Counter realtime (COD SÂNGE)
-- Publish public.profiles so INSERT/UPDATE/DELETE reach the header counter.
-- Idempotent. Does not create a second users table.
-- ============================================================================

do $$
begin
  -- Soft-delete / restore UPDATE payloads need old + new for countable deltas.
  if to_regclass('public.profiles') is not null then
    execute 'alter table public.profiles replica identity full';
  end if;
end $$;

do $$
begin
  if to_regclass('public.profiles') is null then
    raise notice 'ROVEXO registered-user-count: profiles missing — skip publication';
    return;
  end if;

  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    raise notice 'ROVEXO registered-user-count: profiles already in supabase_realtime';
    return;
  end if;

  begin
    alter publication supabase_realtime add table public.profiles;
  exception
    when duplicate_object then
      raise notice 'ROVEXO registered-user-count: profiles publication race — ok';
    when insufficient_privilege then
      raise notice 'ROVEXO registered-user-count: cannot alter publication — apply manually';
  end;
end $$;
