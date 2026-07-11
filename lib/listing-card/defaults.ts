import type { ListingCardProps } from "@/components/ui/ListingCard";

/** Official ROVEXO Listing Card — default surface configuration. */
export const LISTING_CARD_DEFAULT_PROPS = {
  showFavorite: true,
  showCondition: true,
  showBuyerProtection: true,
  showSeller: true,
  showRating: true,
  showViews: true,
  showShare: false,
  showPhotoCount: false,
  showStatusBadge: false,
  showSubtitle: false,
  conditionPlacement: "body",
  buyerProtectionPlacement: "body",
} as const satisfies Partial<ListingCardProps>;

/** Phase 2 — approved compact homepage card (image-first, incl. total + shield, no fee copy). */
export const LISTING_CARD_HOMEPAGE_PROPS = {
  surface: "homepage" as const,
  showFavorite: true,
  showCondition: true,
  showPlatformFee: false,
  showBuyerProtection: true,
  showSeller: false,
  showRating: true,
  showViews: false,
  showShare: false,
  showPhotoCount: false,
  showStatusBadge: false,
  showSubtitle: false,
  conditionPlacement: "body",
  buyerProtectionPlacement: "meta",
} as const satisfies Partial<ListingCardProps>;
