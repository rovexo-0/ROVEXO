-- Ensure service_role can read/write platform_settings in production.
-- PostgREST uses service_role JWT for server admin clients; explicit grants prevent
-- "permission denied for table platform_settings" when default privileges differ.

grant usage on schema public to service_role;

grant select, insert, update, delete on table public.platform_settings to service_role;
grant select, insert, update, delete on table public.profile_entitlements to service_role;
