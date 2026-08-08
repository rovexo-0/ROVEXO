import { LISTING_CARD_HOMEPAGE_PROPS } from "@/lib/listing-card/defaults";

/** Official ListingCard props — ROVEXO Product Card v1.0 SSOT (every product grid). */
export const HP_CANONICAL_LISTING_PROPS = LISTING_CARD_HOMEPAGE_PROPS;

/**
 * P0-01-A — Homepage Marketplace Feed `sizes` only.
 * Describes the existing locked 2-column card width (~half content / ~46vw mobile).
 * Does not change layout, CSS, or card dimensions.
 */
export const HP_FEED_LISTING_IMAGE_SIZES =
  "(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 220px" as const;

/**
 * P0-01-A — Homepage Featured Store / Showcase `sizes` only.
 * Matches existing `--hp-store-card-ref-w`: 112px / 120px (≥640) / 128px (≥1024).
 * Does not change layout, CSS, or card dimensions.
 */
export const HP_SHOWCASE_LISTING_IMAGE_SIZES =
  "(max-width: 639px) 112px, (max-width: 1023px) 120px, 128px" as const;
