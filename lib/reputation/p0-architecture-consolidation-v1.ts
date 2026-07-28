/**
 * P0 Architecture Consolidation — Follow & Trust Freeze gate
 *
 * ONE Badge Engine · ONE Reputation public API · seller-performance internal only.
 */

export const P0_ARCHITECTURE_CONSOLIDATION_V1 = {
  version: "1.0",
  badgeAuthority: "lib/badge/store.ts",
  badgeApi: "/api/badges/[userId]",
  badgeAdminApi: "/api/admin/badges",
  reputationPublicApi: "/api/reputation/[userId]",
  reputationInternalImplementation: "lib/seller-performance",
  legacyReputationRedirect: "/api/seller/performance/[userId]",
  rules: {
    oneBadgeEngine: true,
    oneBadgeStore: true,
    oneBadgeApi: true,
    sellerPerformanceNeverPublishesBadges: true,
    oneReputationPublicApi: true,
    sellerPerformanceInternalOnlyForMetrics: true,
  },
} as const;
