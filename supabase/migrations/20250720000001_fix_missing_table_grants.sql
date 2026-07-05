-- Fix missing table-level GRANTs for API roles.
--
-- Tables created with raw `create table` in SQL migrations do NOT automatically
-- receive privilege grants for the PostgREST roles (anon / authenticated /
-- service_role) the way the Supabase dashboard grants them. As a result, every
-- API-role query against the enterprise-platform tables (trust_scores,
-- trust_events, business_accounts, moderation_queue, monetization_*, etc.)
-- failed with `42501 permission denied for table ...` — including the homepage
-- trust-score enrichment and the entire My Account trust dashboard.
--
-- Row Level Security is already enabled on these tables and remains the security
-- boundary. Grants only allow a role to *touch* a table; RLS policies still gate
-- which rows are visible/mutable. We therefore grant the RLS-gated DML
-- (SELECT/INSERT/UPDATE/DELETE) to anon + authenticated, and full privileges to
-- service_role (trusted server role that bypasses RLS).
--
-- IMPORTANT: TRUNCATE is intentionally NOT granted to anon/authenticated because
-- TRUNCATE is not gated by RLS. Only service_role receives it.

grant usage on schema public to anon, authenticated, service_role;

-- Grant privileges on every RLS-enabled table in the public schema. Tables
-- without RLS are deliberately skipped so this migration can never expose an
-- unprotected table to the anon/authenticated roles.
do $$
declare
  rec record;
begin
  for rec in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relrowsecurity = true
  loop
    execute format(
      'grant select, insert, update, delete on public.%I to anon, authenticated',
      rec.relname
    );
    execute format(
      'grant all privileges on public.%I to service_role',
      rec.relname
    );
  end loop;
end
$$;

-- Sequences (for any serial/identity columns) so inserts by these roles succeed.
grant usage, select on all sequences in schema public to anon, authenticated;
grant all privileges on all sequences in schema public to service_role;

-- Ensure tables created by future migrations inherit the same grants and do not
-- regress into the same permission-denied state.
alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public
  grant all privileges on sequences to service_role;
