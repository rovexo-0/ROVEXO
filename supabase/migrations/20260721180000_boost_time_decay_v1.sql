-- ROVEXO v1.0 — Boost Time Decay Global Freeze (UK First)
-- Temporary ranking only. Never mutates created_at / ownership / stats.
-- Score decays one unit per Europe/London calendar day until expiry.

CREATE OR REPLACE FUNCTION public.compute_promotion_score(
  p_bump_count INTEGER,
  p_bumped_until TIMESTAMPTZ,
  p_featured_until TIMESTAMPTZ,
  p_last_bumped_at TIMESTAMPTZ DEFAULT NULL,
  p_feature_started_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN p_bumped_until IS NOT NULL AND p_bumped_until > NOW() THEN
        GREATEST(
          0,
          100000 - GREATEST(
            0,
            (
              (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/London')::date
              - COALESCE(
                  (p_last_bumped_at AT TIME ZONE 'Europe/London')::date,
                  (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/London')::date
                )
            )
          )
        )
      ELSE 0
    END
    +
    CASE
      WHEN p_featured_until IS NOT NULL AND p_featured_until > NOW() THEN
        GREATEST(
          0,
          90000 - GREATEST(
            0,
            (
              (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/London')::date
              - COALESCE(
                  (p_feature_started_at AT TIME ZONE 'Europe/London')::date,
                  (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/London')::date
                )
            )
          )
        )
      ELSE 0
    END;
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
  -- Daily time-decay recompute for every active (or stale-score) promotion.
  UPDATE public.products p
  SET promotion_score = public.compute_promotion_score(
    p.bump_count,
    p.bumped_until,
    p.featured_until,
    p.last_bumped_at,
    (
      SELECT lp.starts_at
      FROM public.listing_promotions lp
      WHERE lp.product_id = p.id
        AND lp.type = 'feature'
        AND lp.status = 'active'
      ORDER BY lp.starts_at DESC NULLS LAST
      LIMIT 1
    )
  )
  WHERE
    (p.bumped_until IS NOT NULL AND p.bumped_until > NOW())
    OR (p.featured_until IS NOT NULL AND p.featured_until > NOW())
    OR (p.bumped_until IS NOT NULL AND p.bumped_until <= NOW())
    OR (p.featured_until IS NOT NULL AND p.featured_until <= NOW())
    OR p.promotion_score <> 0;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  UPDATE public.listing_promotions
  SET status = 'expired'
  WHERE status = 'active' AND ends_at <= NOW();

  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.compute_promotion_score(INTEGER, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refresh_expired_promotions() TO authenticated, service_role;
