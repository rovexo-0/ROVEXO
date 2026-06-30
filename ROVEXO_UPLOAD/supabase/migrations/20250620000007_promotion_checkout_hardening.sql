-- Promotion checkout hardening: idempotency + wallet history support

ALTER TYPE public.wallet_tx_type ADD VALUE IF NOT EXISTS 'promotion';

CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_promotions_stripe_session_unique
ON public.listing_promotions(stripe_session_id)
WHERE stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listing_promotions_seller_created
ON public.listing_promotions(seller_id, created_at DESC);
