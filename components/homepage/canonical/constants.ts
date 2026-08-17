import { LISTING_CARD_HOMEPAGE_PROPS } from "@/lib/listing-card/defaults";
import { HOMEPAGE_CONTENT_PAD_X_PX } from "@/lib/design-system/design-decision-001-internal-ui-v1.1";
import { HP_FEED_DEFAULT_COLUMNS } from "@/lib/homepage/canonical-responsive";

/** Official ListingCard props — ROVEXO Product Card v1.0 SSOT (every product grid). */
export const HP_CANONICAL_LISTING_PROPS = LISTING_CARD_HOMEPAGE_PROPS;

/**
 * Feed grid gap — must match `[data-hp-homepage="canonical"] { --hp-grid-gap: 10px }`
 * in `styles/homepage-canonical.css`. Delivery math only; does not change layout.
 */
export const HP_FEED_GRID_GAP_PX = 10 as const;

/**
 * Rendered 2-column feed card CSS width.
 * `(viewport - 16px pad × 2 - 10px gap) / 2`
 */
export function homepageFeedCardCssWidthPx(viewportWidth: number): number {
  return Math.floor(
    (viewportWidth - HOMEPAGE_CONTENT_PAD_X_PX * 2 - HP_FEED_GRID_GAP_PX) /
      HP_FEED_DEFAULT_COLUMNS,
  );
}

/**
 * P0-01-A / Phase 1 LCP — Homepage Marketplace Feed `sizes`.
 * Pixel slots match the locked 2-column card width (not 46vw, which made Next.js
 * emit a w=3840 srcset/src fallback). Does not change layout, CSS, or card dimensions.
 */
export const HP_FEED_LISTING_IMAGE_SIZES =
  "(max-width: 440px) 200px, (max-width: 640px) 300px, (max-width: 1024px) 491px, 700px" as const;

/**
 * Single LCP feed image intrinsic CSS width (iPhone Pro Max / PSI mobile card ≈ 185–199px).
 * Passed as Next/Image `width` (no `fill`) so srcset is 1x/2x only — never w=3840.
 */
export const HP_FEED_LCP_IMAGE_WIDTH_PX = 200 as const;

/** 4:5 — same `--rx-listing-image-ratio` as ListingCard visual. */
export const HP_FEED_LCP_IMAGE_HEIGHT_PX = 250 as const;

/**
 * P0-01-A — Homepage Featured Store / Showcase `sizes` only.
 * Matches existing `--hp-store-card-ref-w`: 112px / 120px (≥640) / 128px (≥1024).
 * Does not change layout, CSS, or card dimensions.
 */
export const HP_SHOWCASE_LISTING_IMAGE_SIZES =
  "(max-width: 639px) 112px, (max-width: 1023px) 120px, 128px" as const;

/** Showcase LCP intrinsic width — max of the showcase sizes slots. */
export const HP_SHOWCASE_LCP_IMAGE_WIDTH_PX = 128 as const;

/** 4:5 of showcase LCP width. */
export const HP_SHOWCASE_LCP_IMAGE_HEIGHT_PX = 160 as const;
