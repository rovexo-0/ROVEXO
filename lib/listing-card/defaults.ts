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

export const LISTING_CARD_HOMEPAGE_PROPS = {
  ...LISTING_CARD_DEFAULT_PROPS,
  surface: "homepage" as const,
  showStatusBadge: true,
} as const;
