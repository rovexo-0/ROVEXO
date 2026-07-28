/**
 * ROVEXO FOLLOW & TRUST — CANONICAL FREEZE v1.0
 *
 * STATUS: PERMANENTLY FROZEN · OWNER AUTHORITY · INDEFINITE
 *
 * Covers: Follow · Rating · Reviews · Reputation · Badge ·
 * Follow Notifications · Homepage Following Feed · P0 consolidation.
 *
 * Freeze may be lifted ONLY when Owner explicitly authorizes
 * Architecture Version 2.0. No automatic evolution.
 */

export const FOLLOW_TRUST_CANONICAL_FREEZE_V1 = {
  version: "1.0",
  status: "PERMANENTLY_FROZEN",
  lock: "lib/follow-trust/follow-trust-canonical-freeze-v1.ts",
  exitRequires: "Owner explicit Architecture Version 2.0 authorization",
  automaticEvolution: false,
  modules: [
    "Follow Engine",
    "Rating Engine",
    "Reviews Engine",
    "Reputation Engine",
    "Badge Engine",
    "Follow Notifications Engine",
    "Homepage Following Feed Engine",
    "P0 Architecture Consolidation",
  ] as const,
  preserve: [
    "Canonical architecture",
    "Canonical data flow",
    "Canonical APIs",
    "Canonical database schema",
    "Canonical business rules",
    "Canonical UI behaviour",
    "Canonical user experience",
  ] as const,
  forbidden: [
    "temporary solutions",
    "experimental code",
    "feature flags for parallel behaviour",
    "parallel implementations",
    "fallback architectures",
    "duplicate services",
    "duplicate stores",
    "duplicate APIs",
  ] as const,
  maintenanceAllowed: [
    "critical security fixes",
    "critical production bugs",
    "critical legal compliance",
    "performance telemetry",
    "logging / metrics / monitoring",
    "error reporting / health checks",
  ] as const,
  maintenanceMustNotChange: "business behaviour",
  architectureChangeRequired: {
    action: "STOP",
    return: "ARCHITECTURE CHANGE REQUIRED",
    implementRedesign: false,
    ownerApprovalMandatory: true,
  },
  regressionMustVerify: [
    "Follow",
    "Unfollow",
    "Followers",
    "Following",
    "Rating",
    "Reviews",
    "Reputation",
    "Badges",
    "Notifications",
    "Following Feed",
    "Profile integration",
    "Admin overrides",
  ] as const,
  observability: {
    allowed: true,
    businessBehaviourChange: false,
  },
  documentation: {
    mustMatchProduction: true,
    updateOnApprovedMaintenance: true,
  },
  singularity: {
    badgeEngine: "lib/badge",
    badgeApi: "/api/badges/[userId]",
    reputationApi: "/api/reputation/[userId]",
    followApi: "/api/follows",
    reviewsApi: "/api/reviews",
    followNotificationsApi: "/api/follow-notifications",
    followingFeedApi: "/api/homepage/following-feed",
    sellerPerformance: "internal metrics only — never public badges",
  },
} as const;

export type FollowTrustCanonicalFreezeV1 =
  typeof FOLLOW_TRUST_CANONICAL_FREEZE_V1;

/** Fail-closed gate for agents / release scripts. */
export function assertFollowTrustFreezeOrBlock(input?: {
  architectureChangeProposed?: boolean;
}): void {
  if (input?.architectureChangeProposed) {
    throw new Error(
      "ARCHITECTURE CHANGE REQUIRED — Follow & Trust is permanently frozen. Owner Architecture Version 2.0 authorization mandatory. Do not implement redesign.",
    );
  }
}
