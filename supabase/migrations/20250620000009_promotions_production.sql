-- Promotions production: analytics, admin ops, pending cleanup, suspended status

-- Extend promotion status for admin suspension
ALTER TABLE public.listing_promotions
  DROP CONSTRAINT IF EXISTS listing_promotions_status_check;

ALTER TABLE public.listing_promotions
  ADD CONSTRAINT listing_promotions_status_check
  CHECK (status IN ('pending', 'active', 'expired', 'failed', 'suspended'));

CREATE INDEX IF NOT EXISTS idx_listing_promotions_status_created
  ON public.listing_promotions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_promotions_type_seller_created
  ON public.listing_promotions (seller_id, type, created_at DESC);

-- Promotion analytics (impressions, clicks)
CREATE TABLE IF NOT EXISTS public.promotion_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  promotion_id UUID REFERENCES public.listing_promotions (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
  surface TEXT NOT NULL CHECK (surface IN ('homepage', 'search', 'category', 'listing', 'seller')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotion_analytics_product_created
  ON public.promotion_analytics_events (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_promotion_analytics_seller_created
  ON public.promotion_analytics_events (seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_promotion_analytics_type_created
  ON public.promotion_analytics_events (event_type, created_at DESC);

ALTER TABLE public.promotion_analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promotion_analytics_select_own ON public.promotion_analytics_events;
CREATE POLICY promotion_analytics_select_own
  ON public.promotion_analytics_events FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS listing_promotions_select_admin ON public.listing_promotions;
CREATE POLICY listing_promotions_select_admin
  ON public.listing_promotions FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Fail stale pending promotions (abandoned checkout)
CREATE OR REPLACE FUNCTION public.expire_stale_pending_promotions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.listing_promotions
  SET status = 'failed'
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_stale_pending_promotions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_stale_pending_promotions() TO service_role;

-- Extend refresh to include stale pending cleanup
CREATE OR REPLACE FUNCTION public.refresh_expired_promotions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER;
  stale_count INTEGER;
BEGIN
  PERFORM public.expire_stale_pending_promotions();

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

  GET DIAGNOSTICS stale_count = ROW_COUNT;

  RETURN updated_count + stale_count;
END;
$$;
