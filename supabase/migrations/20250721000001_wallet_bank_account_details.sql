-- ---------------------------------------------------------------------------
-- Native ROVEXO bank account details
-- ---------------------------------------------------------------------------
-- Users enter their bank details directly in ROVEXO (native UI). We store the
-- details on the existing withdraw_methods row (provider = 'bank_account').
-- Any payment-processor onboarding happens server-side only and is never
-- surfaced in the UI.
--
-- SECURITY: sort_code / account_number are sensitive. They are:
--   * encrypted at the column level (AES-256-GCM) by the app before insert
--     when BANK_DETAILS_ENCRYPTION_KEY is set (see lib/wallet/crypto.ts),
--   * protected by row-level security (owner-only),
--   * never mapped to the client (mapWithdrawMethod only exposes last_digits).
-- Stored as ciphertext text ("enc:v1:" + base64); dev without a key stores
-- plaintext. Decryption happens server-side only (getBankAccountForPayout).
alter table public.withdraw_methods
  add column if not exists account_holder_name text,
  add column if not exists sort_code text,
  add column if not exists account_number text;
