import { LISTING_CARD_DEFAULT_PROPS } from "@/lib/listing-card/defaults";

/** Canonical ListingCard props for Homepage V4 surfaces. */
export const HP4_LISTING_CARD_PROPS = {
  ...LISTING_CARD_DEFAULT_PROPS,
  surface: "homepage" as const,
  showStatusBadge: true,
} as const;

export const HP4_FEATURED_VIEW_ALL = "/search?q=&sort=popular";
