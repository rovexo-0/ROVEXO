/**
 * ROVEXO REPUTATION ENGINE v1.0 — ABSOLUTE BLOOD CODE
 *
 * ONE implementation: lib/seller-performance (certified Reputation Engine)
 * ONE store facade: lib/reputation/store.ts
 * ONE public API: GET /api/reputation/[userId]
 *
 * Absolute law: REPUTATION IS CALCULATED — NEVER MANUALLY EDITED.
 *
 * Does NOT replace Rating Engine or Reviews Engine.
 * Does NOT assign badges (Badge Engine only — publicBadges composed from Badge Engine).
 * Does NOT implement search / fraud decisions.
 * Does NOT modify certified dependency modules.
 *
 * P0 consolidation: ONE public API `/api/reputation/[userId]`.
 * Legacy `/api/seller/performance/[userId]` redirects to this facade.
 */

export const REPUTATION_ENGINE_V1 = {
  version: "1.0",
  implementation: "lib/seller-performance",
  store: "lib/reputation/store.ts",
  apiPath: "/api/reputation/[userId]",
  lock: "lib/reputation/reputation-engine-v1.ts",
  absoluteLaw: "REPUTATION_IS_CALCULATED_NEVER_MANUALLY_EDITED",
  consumes: [
    "lib/rating/rating-engine-v1.ts",
    "lib/reviews/reviews-engine-v1.ts",
    "orders",
    "payments",
    "delivery",
    "returns",
    "disputes",
    "verification",
    "response_activity",
    "policy_enforcement",
  ] as const,
  rules: {
    oneEngine: true,
    oneStore: true,
    oneApi: true,
    oneProfilePerUser: true,
    calculatedOnly: true,
    noManualUserEdit: true,
    noManualAdminScoreEdit: true,
    eventDriven: true,
    automaticRecalculation: true,
    failSafePreserveLastVerified: true,
    incrementalPreferred: true,
    neverDuplicateSourceData: true,
  },
  publicDisplay: [
    "averageRating",
    "totalReviews",
    "completedOrders",
    "verificationStatus",
    "publicBadges",
  ] as const,
  neverPublic: [
    "internalScore",
    "fraudScore",
    "moderationScore",
    "riskScore",
    "componentScores",
    "factorBreakdown",
  ] as const,
  consumers: {
    badgeEngine: "signals_only",
    searchRanking: "signals_only",
    trustAndSafety: "signals_only",
    fraudDetection: "signals_only",
    riskAnalysis: "signals_only",
    adminTools: "internal_dashboard",
  },
  doesNotModify: [
    "Rating Engine",
    "Reviews Engine",
    "Badge Engine",
    "Follow Engine",
    "Notifications",
    "Homepage",
    "Orders",
    "Checkout",
    "Wallet",
    "Messaging",
    "Search",
    "Products",
    "Categories",
  ] as const,
} as const;
