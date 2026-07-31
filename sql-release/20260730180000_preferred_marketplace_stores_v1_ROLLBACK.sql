BEGIN;

DROP POLICY IF EXISTS "preferred_marketplace_stores_select_admin" ON public.preferred_marketplace_stores;

DROP INDEX IF EXISTS public.preferred_marketplace_stores_enabled_priority_idx;

DROP TABLE IF EXISTS public.preferred_marketplace_stores;

COMMIT;
