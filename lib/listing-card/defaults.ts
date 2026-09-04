import type { ListingCardProps } from "@/components/ui/ListingCard";

/**
 * ROVEXO Product Card v1.0 — SINGLE SOURCE OF TRUTH.
 * One component (`ListingCard`) · one prop bundle · every product grid.
 *
 * Displays: image · favourite · price · incl. total · title · condition ·
 * click → product page.
 * Homepage: rating + views removed (no empty gaps).
 * Never: seller name · location · parallel marketplace card implementations.
 * SearchResultCard is the Owner-approved Search typeahead / autocomplete exception only
 * (Cluster 4 SSOT lock — not a second marketplace card).
 */
export const LISTING_CARD_HOMEPAGE_PROPS = {
  surface: "homepage" as const,
  showFavorite: true,
  showCondition: true,
  showPlatformFee: false,
  showBuyerProtection: true,
  showSeller: false,
  showRating: false,
  showViews: false,
  showShare: false,
  showPhotoCount: false,
  showStatusBadge: false,
  showSubtitle: false,
  conditionPlacement: "body",
  buyerProtectionPlacement: "meta",
} as const satisfies Partial<ListingCardProps>;

/** @deprecated Use LISTING_CARD_HOMEPAGE_PROPS — same canonical Product Card v1.0. */
export const LISTING_CARD_DEFAULT_PROPS = LISTING_CARD_HOMEPAGE_PROPS;

/** Alias — Product Card v1.0 SSOT. */
export const ROVEXO_PRODUCT_CARD_PROPS = LISTING_CARD_HOMEPAGE_PROPS;
