/**
 * ROVEXO Canonical Edit Listing Engine v1.0
 *
 * STATUS: OWNER AUTHORIZED · SINGLE SELL FORM · ZERO DUPLICATION
 *
 * CREATE and EDIT share one component: `SellPage` (+ SellProvider).
 * Edit route is a thin loader only — never a second form.
 */
export const CANONICAL_EDIT_LISTING_ENGINE_V1 = {
  id: "canonical-edit-listing-engine-v1",
  version: "1.0.0",
  status: "AUTHORIZED",
  equation: "ONE_SELL_FORM = CREATE_MODE | EDIT_MODE",
  canonicalComponent: "features/sell/ui/SellPage.tsx",
  createRoute: "/sell",
  /** Thin route — loads listing → SellPage(editListingId, initialDraft). */
  editRoutePattern: "/seller/listings/[id]/edit",
  createTitle: "Create Listing",
  editTitle: "Edit Listing",
  createCta: "Publish",
  editCta: "Save Changes",
  afterEditReturn: "listing_details",
  preserveOnUpdate: [
    "listingId",
    "createdAt",
    "views",
    "likes",
    "favourites",
    "order_history",
    "analytics",
    "slug",
  ] as const,
  sellerMenuActions: [
    "edit_listing",
    "mark_as_sold",
    "pause_listing",
    "relist",
    "delete_listing",
  ] as const,
  buyerMenuActions: [
    "save",
    "report_listing",
    "report_seller",
    "block_seller",
    "share",
  ] as const,
  forbiddenSellerMenuActions: [
    "report_listing",
    "report_seller",
    "block_seller",
    "hide_listing",
  ] as const,
  forbidden: [
    "SECOND_EDIT_PAGE",
    "DUPLICATE_FORM",
    "DUPLICATE_VALIDATION",
    "CREATE_ON_SAVE_CHANGES",
  ] as const,
} as const;

export type CanonicalEditListingEngineV1 = typeof CANONICAL_EDIT_LISTING_ENGINE_V1;

export function sellPageTitle(isEdit: boolean): string {
  return isEdit
    ? CANONICAL_EDIT_LISTING_ENGINE_V1.editTitle
    : CANONICAL_EDIT_LISTING_ENGINE_V1.createTitle;
}

export function sellPrimaryCtaLabel(isEdit: boolean): string {
  return isEdit
    ? CANONICAL_EDIT_LISTING_ENGINE_V1.editCta
    : CANONICAL_EDIT_LISTING_ENGINE_V1.createCta;
}

export function editListingHref(listingId: string): string {
  return `/seller/listings/${listingId}/edit`;
}
