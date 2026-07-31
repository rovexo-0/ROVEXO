BEGIN;

ALTER TABLE public.notification_settings
  DROP COLUMN IF EXISTS engine_v1;

ALTER TABLE public.user_settings
  DROP COLUMN IF EXISTS privacy_engine_v1;

ALTER TABLE public.user_settings
  DROP COLUMN IF EXISTS cookie_preferences_v1;

COMMIT;
