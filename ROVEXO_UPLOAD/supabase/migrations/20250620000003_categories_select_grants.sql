-- categories embed is used by seller listings queries:
--   categories ( path_label )
-- RLS policy categories_select_all exists, but PostgREST also requires table GRANTs.

grant select on table public.categories to anon;
grant select on table public.categories to authenticated;
grant all on table public.categories to service_role;
