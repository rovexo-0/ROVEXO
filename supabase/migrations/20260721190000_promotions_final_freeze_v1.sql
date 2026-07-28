-- ROVEXO v1.0 — Promotions Final Freeze (Owner priority curves × 1000)
-- Boost 7d: 100,90,…,40 · Bump 3d: 100,70,40 · Store 30d: 100→1
-- UK calendar days (Europe/London). Never mutates created_at.

CREATE OR REPLACE FUNCTION public.compute_promotion_score(
  p_bump_count INTEGER,
  p_bumped_until TIMESTAMPTZ,
  p_featured_until TIMESTAMPTZ,
  p_last_bumped_at TIMESTAMPTZ DEFAULT NULL,
  p_feature_started_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  bump_priority INTEGER := 0;
  feature_priority INTEGER := 0;
  bump_elapsed INTEGER := 0;
  feature_elapsed INTEGER := 0;
  bump_days INTEGER := 7;
  feature_days INTEGER := 30;
  london_today DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/London')::date;
BEGIN
  IF p_bumped_until IS NOT NULL AND p_bumped_until > NOW() THEN
    bump_elapsed := GREATEST(
      0,
      (
        london_today
        - COALESCE(
            (p_last_bumped_at AT TIME ZONE 'Europe/London')::date,
            london_today
          )
      )
    );
    IF p_last_bumped_at IS NOT NULL THEN
      bump_days := GREATEST(
        1,
        ROUND(EXTRACT(EPOCH FROM (p_bumped_until - p_last_bumped_at)) / 86400.0)::INTEGER
      );
    END IF;
    -- ≤3.5d → bump curve (−30/day); else boost curve (−10/day)
    IF bump_days <= 3 THEN
      bump_priority := GREATEST(0, 100 - bump_elapsed * 30);
    ELSE
      bump_priority := GREATEST(0, 100 - bump_elapsed * 10);
    END IF;
  END IF;

  IF p_featured_until IS NOT NULL AND p_featured_until > NOW() THEN
    feature_elapsed := GREATEST(
      0,
      (
        london_today
        - COALESCE(
            (p_feature_started_at AT TIME ZONE 'Europe/London')::date,
            london_today
          )
      )
    );
    IF p_feature_started_at IS NOT NULL THEN
      feature_days := GREATEST(
        1,
        ROUND(EXTRACT(EPOCH FROM (p_featured_until - p_feature_started_at)) / 86400.0)::INTEGER
      );
    END IF;
    IF feature_days <= 1 THEN
      feature_priority := 100;
    ELSIF feature_elapsed >= feature_days - 1 THEN
      feature_priority := 1;
    ELSE
      feature_priority := GREATEST(
        1,
        ROUND(100 - (feature_elapsed::NUMERIC / (feature_days - 1)) * 99)::INTEGER
      );
    END IF;
  END IF;

  RETURN GREATEST(bump_priority, feature_priority) * 1000;
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
