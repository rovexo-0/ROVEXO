-- ROVEXO v1.0 — seller_promotions + promotion_action_audit table creation.
-- Must apply before 20250712000002, which ALTERs both relations.
-- Canonical 20250712000003 remains IF NOT EXISTS and therefore
-- must not be removed or modified.

CREATE TABLE IF NOT EXISTS public.seller_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('store_featured', 'boost_package')),
  package_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'scheduled', 'paused', 'expired', 'failed', 'revoked')),
  starts_at timestamptz,
  ends_at timestamptz,
  amount_cents integer NOT NULL DEFAULT 0,
  granted_by_admin boolean NOT NULL DEFAULT false,
  granted_by_admin_id uuid REFERENCES public.profiles (id),
  stripe_session_id text,
  stripe_payment_intent_id text,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promotion_action_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles (id),
  actor_username text,
  user_id uuid NOT NULL REFERENCES public.profiles (id),
  username text,
  promotion_type text NOT NULL,
  listing_id uuid REFERENCES public.products (id) ON DELETE SET NULL,
  seller_promotion_id uuid REFERENCES public.seller_promotions (id) ON DELETE SET NULL,
  listing_promotion_id uuid REFERENCES public.listing_promotions (id) ON DELETE SET NULL,
  previous_status text,
  new_status text NOT NULL,
  reason text,
  duration_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
