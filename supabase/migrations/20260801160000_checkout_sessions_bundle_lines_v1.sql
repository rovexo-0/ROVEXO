-- Bundle multi-item lines on checkout sessions (same-seller).
-- Null = single-listing checkout (legacy path unchanged).

ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS bundle_lines jsonb NULL;

COMMENT ON COLUMN public.checkout_sessions.bundle_lines IS
  'Same-seller multi-item lines for Bundle Checkout. Null = single listing.';
