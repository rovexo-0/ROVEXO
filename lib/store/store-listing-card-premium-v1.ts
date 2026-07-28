/**
 * ROVEXO v1.0 — STORE CARD PREMIUM FREEZE (Compact Premium Lock)
 *
 * Primary scope: Store page · Visit Store · Business Store.
 * Homepage Showcase reuses the same Visit density tokens (9 + View All rail only).
 * Forbidden on Homepage feed / Search / Category / Brand / Recommended / Similar.
 *
 * Reuses canonical `ListingCard` — density via `data-store-listing-cards` only.
 */

export const STORE_LISTING_CARD_VERSION = "1.0" as const;
export const STORE_LISTING_CARD_STATUS = "CEO_APPROVED_COMPACT_PREMIUM_FREEZE" as const;
export const STORE_LISTING_CARD_DOM = "data-store-listing-cards" as const;

export type StoreListingCardDensity = "store" | "visit" | "business";

export const STORE_LISTING_CARD_TOKENS = {
  store: {
    imageWidth: 88,
    imageHeight: 128,
    cardMinHeight: 240,
    imagePadding: 8,
    gap: 8,
    imageRadius: 16,
  },
  visit: {
    imageWidth: 96,
    imageHeight: 136,
    cardMinHeight: 250,
    imagePadding: 8,
    gap: 8,
    imageRadius: 16,
  },
  business: {
    imageWidth: 96,
    imageHeight: 136,
    cardMinHeight: 250,
    imagePadding: 8,
    gap: 8,
    imageRadius: 16,
  },
} as const satisfies Record<
  StoreListingCardDensity,
  {
    imageWidth: number;
    imageHeight: number;
    cardMinHeight: number;
    imagePadding: number;
    gap: number;
    imageRadius: number;
  }
>;

/** Image → 8 → Price → 6 → Title → 4 → Condition → 4 → Rating */
export const STORE_LISTING_CARD_SPACING = {
  imageToPrice: 8,
  priceToTitle: 6,
  titleToCondition: 4,
  conditionToRating: 4,
} as const;

export const STORE_LISTING_CARD_IMAGE_LOCK = {
  objectFit: "cover",
  objectPosition: "center",
  overflow: "hidden",
  borderRadius: 16,
} as const;

export function storeListingCardAttr(
  density: StoreListingCardDensity,
): { "data-store-listing-cards": StoreListingCardDensity } {
  return { "data-store-listing-cards": density };
}
