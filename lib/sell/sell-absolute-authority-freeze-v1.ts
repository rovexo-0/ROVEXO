/**
 * ROVEXO Sell Absolute Authority Freeze SSOT v1.0
 * STATUS: CODE-FROZEN · Owner visual FINAL CERTIFIED pending
 * Route: /sell · features/sell/ui/SellPage.tsx
 */

export const SELL_ABSOLUTE_AUTHORITY_FREEZE_V1 = {
  version: "v1.0-final-frozen",
  route: "/sell",
  page: "features/sell/ui/SellPage.tsx",
  designSystem: "AccountCanonicalShell + CDS only",
  controlHeightPx: 56,
  sectionGapPx: 12,
  photo: { width: 76, height: 114, radius: 16, gap: 6, max: 8 },
  publishGate: ["photos", "title", "description", "category", "price", "parcel"] as const,
  category: ["Suggested", "Choose another category", "Search categories"] as const,
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
  ] as const,
} as const;

export type SellAbsoluteAuthorityFreezeV1 = typeof SELL_ABSOLUTE_AUTHORITY_FREEZE_V1;
