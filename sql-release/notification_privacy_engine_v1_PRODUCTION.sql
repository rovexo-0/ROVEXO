-- ROVEXO Notification & Privacy Engine v1.0
-- Granular prefs as jsonb; legacy boolean columns remain synced by application code.

ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS engine_v1 jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS privacy_engine_v1 jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS cookie_preferences_v1 jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.notification_settings.engine_v1 IS
  'Notification Engine v1.0 granular topic/channel preferences';

COMMENT ON COLUMN public.user_settings.privacy_engine_v1 IS
  'Privacy Engine v1.0 granular privacy controls';

COMMENT ON COLUMN public.user_settings.cookie_preferences_v1 IS
  'Cookie Preferences v1.0 category switches';
