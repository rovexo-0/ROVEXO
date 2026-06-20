-- Listing promotion durations and payment audit trail

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS bumped_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_bumped_until
ON public.products(bumped_until DESC);

CREATE TABLE IF NOT EXISTS public.listing_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bump', 'feature')),
  duration_id TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'expired', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_promotions_product_id
ON public.listing_promotions(product_id);

CREATE INDEX IF NOT EXISTS idx_listing_promotions_seller_id
ON public.listing_promotions(seller_id);

CREATE INDEX IF NOT EXISTS idx_listing_promotions_stripe_session
ON public.listing_promotions(stripe_session_id)
WHERE stripe_session_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.compute_promotion_score(
  p_bump_count INTEGER,
  p_bumped_until TIMESTAMPTZ,
  p_featured_until TIMESTAMPTZ
)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE WHEN p_featured_until IS NOT NULL AND p_featured_until > NOW() THEN 1000 ELSE 0 END
    + CASE WHEN p_bumped_until IS NOT NULL AND p_bumped_until > NOW() THEN 500 + COALESCE(p_bump_count, 0) * 10 ELSE 0 END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_expired_promotions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.products
  SET promotion_score = public.compute_promotion_score(bump_count, bumped_until, featured_until)
  WHERE
    (bumped_until IS NOT NULL AND bumped_until <= NOW())
    OR (featured_until IS NOT NULL AND featured_until <= NOW())
    OR promotion_score <> public.compute_promotion_score(bump_count, bumped_until, featured_until);

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  UPDATE public.listing_promotions
  SET status = 'expired'
  WHERE status = 'active' AND ends_at <= NOW();

  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_expired_promotions() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.compute_promotion_score(INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated, service_role;

ALTER TABLE public.listing_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY listing_promotions_select_own
ON public.listing_promotions
FOR SELECT
TO authenticated
USING (seller_id = auth.uid());

CREATE POLICY listing_promotions_insert_own
ON public.listing_promotions
FOR INSERT
TO authenticated
WITH CHECK (seller_id = auth.uid());
