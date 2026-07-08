import { LISTING_CARD_DEFAULT_PROPS } from "@/lib/listing-card/defaults";

/** Canonical ListingCard props for Homepage V3 surfaces. */
export const HP3_LISTING_CARD_PROPS = {
  ...LISTING_CARD_DEFAULT_PROPS,
  surface: "homepage" as const,
};

export const HP3_VIEW_ALL = {
  featured: "/search?q=&sort=popular",
  recommended: "/search?q=&sort=recommended",
  newest: "/search?q=&sort=newest",
  boosted: "/search?q=&sort=trending",
  feed: "/search",
} as const;
