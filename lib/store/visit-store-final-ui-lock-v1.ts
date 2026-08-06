/**
 * ROVEXO OWNER FREEZE CERTIFICATE — VISIT STORE
 *
 * Module: Visit Store
 * Version: STORE v2.0 FINAL
 * Status: PRODUCTION_FREEZE_ACTIVE
 * Freeze Date: Owner Approved
 *
 * Scope: /store/[slug] ONLY
 * SSOT UI: features/store/components/StoreVisitPageV2.tsx
 *
 * Profile `/user/[username]` is OUT OF SCOPE — never modify for Store work.
 *
 * Commit / Push / Deploy: BLOCKED until explicit Owner approval.
 * ANY regression inside Visit Store = STOP · fix before any other work.
 */

const PROTECTED_UI = [
  "Canonical Header (ROVEXO Header Standard v1.0)",
  "← Back",
  "Store (title)",
  "✕ Close",
  "Hero Banner (compact discrete)",
  "Large centered Avatar",
  "Verified Badge",
  "Store Name",
  "@Username",
  "Rating · Followers · Following · Member since (single row)",
  "Follow (only large full-width button)",
  "Share icon (hero top-right)",
  "Report icon (hero top-right)",
  "Listings | Reviews (50% / 50%)",
  "Listings grid immediately under tabs",
  "Existing ListingCard (Favourite · Price · Condition · View Count)",
  "Load More",
  "Reviews",
  "Rating Summary",
  "Rating Breakdown",
  "Verified Purchase",
  "Product thumbnail on each review",
  "Thumbnail opens Listing page only",
] as const;

const PROTECTED_FUNCTIONALITY = [
  "Favorite",
  "Share (icon)",
  "Report (icon)",
  "Buy Now",
  "Make Offer",
  "Follow",
  "View Listing",
  "Existing navigation",
  "Existing realtime",
] as const;

/** Forbidden on Visit Store — Mobile Canonical v2.0 */
export const VISIT_STORE_FORBIDDEN_MESSAGE_CTA = [
  "Message button",
  "Message CTA",
  "message-related API/UI from Store",
] as const;

export const VISIT_STORE_COMPACT_REMOVED = [
  "ABOUT",
  "STATISTICS",
  "BUSINESS",
  "FILTER",
  "Share Store button",
  "Report Store button",
  "Message Button",
  "Unable to share store.",
] as const;

/** Share Store Behaviour Freeze — ACTIVE (P2 hotfix) */
export const VISIT_STORE_SHARE_BEHAVIOUR_V1 = {
  status: "ACTIVE",
  handler: "handleShare",
  invoke: "synchronous navigator.share on tap · no awaits before share",
  forbiddenPrechecks: ["navigator.canShare blocking"] as const,
  desktop: "navigator.share when available · else Copy Link",
  mobile: "iOS / Android native Share Sheet via navigator.share",
  payload: {
    title: "Store Name",
    url: "absolute Store URL (URL href)",
    text: "Check out this ROVEXO Store",
  },
  abortError: "do nothing · no toast · no clipboard",
  fallback: {
    when: ["navigator.share missing", "non-AbortError exception"] as const,
    action: "clipboard copy Store URL",
    toast: "Store link copied",
  },
  forbiddenToast: "Unable to share store.",
  permissionsPolicy: "web-share=(self)",
} as const;

export const VISIT_STORE_FINAL_UI_LOCK_V1 = {
  version: "2.0",
  module: "Visit Store",
  canonicalVersion: "STORE v2.0 FINAL",
  status: "PRODUCTION_FREEZE_ACTIVE",
  freezeStatus: "PRODUCTION_FREEZE_ACTIVE",
  freezeDate: "Owner Approved",
  ownerApproved: true,
  ownerVerified: true,
  freezeLocked: true,
  productionReady: true,
  freezeActive: true,

  route: "/store/[slug]",
  officialLocal: "http://localhost:3000/store/[slug]",
  officialOwner: "https://www.rovexo.co.uk/store/[slug]",

  protectedFiles: [
    "features/store/components/StoreVisitPageV2.tsx",
    "styles/rovexo/store-visit-v2.css",
    "lib/store/load-store-visit-payload.ts",
    "app/(platform)/store/[slug]/page.tsx",
  ] as const,

  page: "features/store/components/StoreVisitPageV2.tsx",
  styles: "styles/rovexo/store-visit-v2.css",
  loader: "lib/store/load-store-visit-payload.ts",
  routeFile: "app/(platform)/store/[slug]/page.tsx",
  ssot: "lib/store/store-v2-final-v1.ts",
  headerStandard: "lib/header/rovexo-header-standard-v1.ts",

  protectedUi: PROTECTED_UI,
  /** Compatibility alias */
  canonicalUi: PROTECTED_UI,

  header: {
    standard: "ROVEXO Header Standard v1.0",
    layout: ["back", "title:Store", "close"] as const,
    mustMatch: "Orders",
    component: "features/account-canonical/header/AccountCanonicalHeader.tsx",
  } as const,

  protectedFunctionality: PROTECTED_FUNCTIONALITY,
  /** Compatibility alias */
  protectedBehavior: PROTECTED_FUNCTIONALITY,

  forbiddenUi: [
    "Featured section",
    "Search",
    "Filter",
    "Order Journey",
    "ABOUT",
    "STATISTICS",
    "BUSINESS",
    "Share Store button",
    "Report Store button",
    "Message button",
    "View Profile button",
  ] as const,

  explicitlyForbidden: [
    "UI redesign",
    "spacing changes",
    "typography changes",
    "header changes",
    "card redesign",
    "component replacement",
    "layout restructuring",
    "CSS overrides",
    "business logic changes",
    "routing changes",
    "database changes",
  ] as const,

  outOfScope: [
    "Homepage",
    "Checkout",
    "Authentication",
    "Profile page (/user/[username])",
    "Business Dashboard",
    "Admin",
  ] as const,

  /** Profile is a separate module — never absorb Store freeze into Profile. */
  outsideFreeze: {
    route: "/user/[username]",
    page: "features/profile/components/ViewProfilePage.tsx",
    rule: "Must remain identical to previously approved canonical Profile",
  } as const,

  allowedAfterFreeze: [
    "Owner-authorized critical bug fixes",
    "Owner-authorized security fixes",
    "Owner-authorized accessibility fixes",
    "Owner-authorized performance optimizations",
    "Owner-authorized browser compatibility fixes",
  ] as const,

  forbiddenAfterFreeze: [
    "UI redesign",
    "Layout changes",
    "Spacing changes",
    "Typography changes",
    "Header changes",
    "Card redesign",
    "Component replacement",
    "Structural changes",
    "CSS overrides",
    "Business logic changes",
    "Routing changes",
    "Database changes",
    "New features",
    "Removing existing functionality",
    "Any modification without Owner authorization",
  ] as const,

  regressionPolicy: {
    anyVisualOrFunctionalRegression: "STOP",
    fixBeforeAdditionalWork: true,
  } as const,

  releaseGates: {
    typescript: "PASS",
    eslint: "PASS",
    build: "PASS",
    relatedTests: "PASS",
    mobileQa: "PASS",
    desktopQa: "PASS",
    responsive: "PASS",
    noRegressionsDetected: "PASS",
  } as const,

  commit: "BLOCKED",
  push: "BLOCKED",
  deploy: "BLOCKED",
  awaiting: "Owner approval before commit, push, or production deployment",
} as const;

export type VisitStoreFinalUiLockV1 = typeof VISIT_STORE_FINAL_UI_LOCK_V1;
