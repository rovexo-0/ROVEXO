/**
 * ROVEXO Sell Absolute Authority Freeze SSOT v1.0.1
 * STATUS: CODE-FROZEN · Owner visual FINAL CERTIFIED pending
 * Route: /sell · features/sell/ui/SellPage.tsx
 *
 * Owner unlock (COD SÂNGE consolidated release):
 * Publish CTA is inline below Parcel Size — sticky viewport Publish unlocked/removed.
 */

export const SELL_ABSOLUTE_AUTHORITY_FREEZE_V1 = {
  version: "v1.0.1-final-frozen",
  route: "/sell",
  page: "features/sell/ui/SellPage.tsx",
  designSystem: "AccountCanonicalShell + CDS only",
  controlHeightPx: 56,
  sectionGapPx: 12,
  photo: { width: 76, height: 114, radius: 16, gap: 6, max: 8 },
  publishGate: ["photos", "title", "description", "category", "price", "parcel"] as const,
  /** Owner-approved: inline Publish immediately below Parcel Size (not sticky chrome). */
  publishPosition: "below-parcel" as const,
  publishStickyViewport: false,
  publishBar: {
    component: "features/sell/ui/SellPublishBar.tsx",
    dataAttr: "data-sell-publish-bar",
    positionAttr: 'data-sell-publish-position="below-parcel"',
    forbiddenClass: "account-settings-sticky-action",
  } as const,
  category: ["Manual Category", "Search categories"] as const,
  categoryEngine: "category-engine-v1-manual-only" as const,
  parcel: ["SMALL", "MEDIUM", "LARGE", "EXTRA LARGE"] as const,
  parcelRecommended: false,
  colourInput: "select-single",
  singleSelect: "tap → save → return (no Apply)",
  multiSelect: "Apply allowed when required",
  photoAdd: { icon: "CameraLineIcon", label: "Add Photos" },
  success: {
    closeToHome: true,
    photo: true,
    title: "Listing successfully published",
    body: "Your listing is now live.",
    actions: ["View Listing", "Share Listing", "Sell Another Item"] as const,
  },
  forbidden: [
    "SellReviewBlock",
    "SellConditionBlock",
    "SellScreen",
    "CanonicalCard on Sell form",
    "Recommended parcel badge",
    "Sell-only 40px densify",
    "Sticky viewport Publish CTA",
    "account-settings-sticky-action on Sell Publish",
  ] as const,
} as const;

export type SellAbsoluteAuthorityFreezeV1 = typeof SELL_ABSOLUTE_AUTHORITY_FREEZE_V1;
