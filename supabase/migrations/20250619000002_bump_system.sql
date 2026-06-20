-- Bump & Promotion System

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS bump_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS last_bumped_at TIMESTAMPTZ;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS promotion_score INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_last_bumped
ON public.products(last_bumped_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_featured_until
ON public.products(featured_until DESC);

CREATE INDEX IF NOT EXISTS idx_products_promotion_score
ON public.products(promotion_score DESC);