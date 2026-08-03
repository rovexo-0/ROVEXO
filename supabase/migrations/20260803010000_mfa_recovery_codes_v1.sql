-- ROVEXO MFA recovery codes v1.0 (TOTP Two-Factor Authentication)
-- Hashes only. Service-role access from API routes. No client plaintext.

CREATE TABLE IF NOT EXISTS public.mfa_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  batch_id uuid NOT NULL,
  used_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mfa_recovery_codes_hash_unique UNIQUE (user_id, code_hash)
);

CREATE INDEX IF NOT EXISTS mfa_recovery_codes_user_unused_idx
  ON public.mfa_recovery_codes (user_id)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS mfa_recovery_codes_batch_idx
  ON public.mfa_recovery_codes (batch_id);

ALTER TABLE public.mfa_recovery_codes ENABLE ROW LEVEL SECURITY;

-- No authenticated policies: application uses service role only.
DROP POLICY IF EXISTS mfa_recovery_codes_deny_all ON public.mfa_recovery_codes;
CREATE POLICY mfa_recovery_codes_deny_all
  ON public.mfa_recovery_codes
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

COMMENT ON TABLE public.mfa_recovery_codes IS
  'ROVEXO MFA v1.0 — hashed one-time recovery codes for TOTP 2FA. Service role only.';
