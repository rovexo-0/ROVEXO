import { LISTING_CARD_HOMEPAGE_PROPS } from "@/lib/listing-card/defaults";

/** Canonical ListingCard props — Product Card v1.0 SSOT (same as Homepage). */
export const HP3_LISTING_CARD_PROPS = LISTING_CARD_HOMEPAGE_PROPS;

export const HP3_VIEW_ALL = {
  featured: "/search?q=&sort=popular",
  recommended: "/search?q=&sort=recommended",
  newest: "/search?q=&sort=newest",
  boosted: "/search?q=&sort=trending",
  feed: "/search",
} as const;
