-- P0 post-payment shipping persistence
-- Persist selected Sendcloud quote identity through checkout → order → shipping_records.
-- Observable shipping setup state for orphan paid-order repair (no new tables).

ALTER TABLE public.checkout_sessions
  ADD COLUMN IF NOT EXISTS selected_shipping_quote_id text NULL;

COMMENT ON COLUMN public.checkout_sessions.selected_shipping_quote_id IS
  'Canonical selected shipping quote id at Confirm & Pay (e.g. sendcloud:<methodId>). Never reconstruct from carrier/price.';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS selected_shipping_quote_id text NULL;

COMMENT ON COLUMN public.orders.selected_shipping_quote_id IS
  'Selected shipping quote id copied from checkout session at order create (e.g. sendcloud:<methodId>).';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_setup_status text NOT NULL DEFAULT 'pending';

DO $$
BEGIN
  ALTER TABLE public.orders
    ADD CONSTRAINT orders_shipping_setup_status_check
    CHECK (shipping_setup_status IN ('pending', 'ready', 'repair_required', 'failed'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.orders.shipping_setup_status IS
  'Post-payment shipping persistence: pending → ready | repair_required | failed. Payment success is independent.';

CREATE INDEX IF NOT EXISTS orders_shipping_setup_status_idx
  ON public.orders (shipping_setup_status)
  WHERE shipping_setup_status IN ('pending', 'repair_required', 'failed');
