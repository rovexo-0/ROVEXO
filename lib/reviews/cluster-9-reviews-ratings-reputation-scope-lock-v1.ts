/**
 * ROVEXO CLUSTER 9 — REVIEWS, RATINGS & REPUTATION
 * SCOPE LOCK v1.0
 *
 * OWNER APPROVED · ARCHITECTURE SCOPE LOCKED
 * Cod Sânge — Cluster 9 · Owner Architecture Decision PASS
 *
 * Equation:
 * Completed Order → Eligibility → Review Authority → Rating Aggregation
 * → Reputation Engine → Badge Engine → emitSmartNotification
 * → Public Profile / Listing
 * = CLUSTER 9 v1.0 SCOPE LOCK
 *
 * OWNER VISUAL QA PASS · PRODUCTION READY · FROZEN · CERTIFIED
 * Do not rewrite Reviews / Rating / Reputation / Badge engines under this lock.
 */

export const CLUSTER_9_REVIEWS_RATINGS_REPUTATION_SCOPE_LOCK_V1 = {
  version: "1.0",
  cluster: "CLUSTER_9_REVIEWS_RATINGS_REPUTATION",
  id: "cluster-9-reviews-ratings-reputation-scope-lock-v1",
  status: "OWNER_APPROVED_PRODUCTION_READY_FROZEN",
  approvedByOwner: true,
  scopeLocked: true,
  architectureCertified: true,
  productionReady: true,
  freezeApplied: true,
  technicalCertificationPass: true,
  ownerVisualQaPass: true,
  ownerVisualQa: "PASS" as const,
  productionStatus: "CERTIFIED" as const,

  equation:
    "COMPLETED_ORDER + ELIGIBILITY + REVIEW_AUTHORITY + RATING_AGGREGATION + REPUTATION + BADGE + EMIT_SMART + PUBLIC_DISPLAY",

  authorities: {
    review: {
      role: "SOLE_REVIEW_AUTHORITY",
      store: "lib/reviews/store.ts",
      rpc: "create_order_review",
      api: "/api/reviews",
      lock: "lib/reviews/reviews-engine-v1.ts",
      table: "reviews",
    },
    rating: {
      role: "SOLE_RATING_AUTHORITY",
      lock: "lib/rating/rating-engine-v1.ts",
      store: "lib/reviews/store.ts",
      calculation: "lib/reviews/rating-distribution.ts",
      aggregation: "refresh_seller_rating + refresh_product_rating",
      scaleLock: "lib/reviews/seller-rating-system-v1.ts",
    },
    reputation: {
      role: "SOLE_REPUTATION_AUTHORITY",
      implementation: "lib/seller-performance/*",
      facade: "lib/reputation/store.ts",
      lock: "lib/reputation/reputation-engine-v1.ts",
      api: "/api/reputation/[userId]",
      absoluteLaw: "REPUTATION_IS_CALCULATED_NEVER_MANUALLY_EDITED",
    },
    badge: {
      role: "SOLE_BADGE_AUTHORITY",
      store: "lib/badge/*",
      lock: "lib/badge/badge-engine-v1.ts",
      api: "/api/badges/[userId]",
      consumes: "Reputation signals only",
    },
    moderation: {
      role: "POLICY_ONLY_DEFERRED_PRODUCT",
      status: "DEFERRED_V1_1",
      userDelete: "FORBIDDEN",
      superAdminMayRemove: "POLICY_ONLY",
      productWorkflow: "DEFERRED_V1_1",
      note: "Moderation must never become a second Review Authority",
    },
  } as const,

  canonicalReviewFlow: [
    "COMPLETED_ORDER",
    "ELIGIBILITY_CHECK",
    "REVIEW_AUTHORITY",
    "RATING_AGGREGATION",
    "REPUTATION_ENGINE",
    "BADGE_ENGINE",
    "EMIT_SMART_NOTIFICATION",
    "PUBLIC_PROFILE_OR_LISTING",
  ] as const,

  singularity: {
    reviewAuthority: "lib/reviews/store.ts + create_order_review",
    ratingAuthority: "lib/rating/rating-engine-v1.ts",
    reputationAuthority: "lib/seller-performance/* → lib/reputation/store.ts",
    badgeAuthority: "lib/badge/*",
    parentFreeze: "lib/follow-trust/follow-trust-canonical-freeze-v1.ts",
    bloodCode: "lib/supreme-blood-code-xlvi-follow-rating-badge-v1.ts",
    notificationEntry: "emitSmartNotification (from Review Authority after persist)",
    publicReviewsUi: "features/profile/components/SellerReviewsSection.tsx",
    accountReviewsUi: "features/account-module/components/ReviewsV1.tsx",
    orderReviewUi: "features/orders/components/OrderReviewCard.tsx",
  } as const,

  enabledV1: [
    "Buyer → Seller reviews",
    "Seller → Buyer reviews",
    "Verified Purchase",
    "Public ratings",
    "Reputation score",
    "Reputation badges",
    "Review notifications",
    "Public review display",
  ] as const,

  deferredToV1_1: [
    "Review report flow",
    "Review moderation UI",
    "Review reply UI",
    "Review edit UI",
    "Buyer review history",
    "Review analytics",
  ] as const,

  deferredGates: {
    reviewReportFlow: {
      status: "DEFERRED_V1_1",
      note: "No report-this-review product path in Cluster 9 v1.0",
    },
    reviewModerationUi: {
      status: "DEFERRED_V1_1",
      path: "app/(platform)/super-admin/reviews/page.tsx",
      note: "Placeholder only — excluded from Cluster 9 certification",
    },
    reviewReplyUi: {
      status: "DEFERRED_V1_1",
      apiExists: true,
      uiExists: false,
      note: "replyToReview API may remain; UI excluded from v1.0 certification",
    },
    reviewEditUi: {
      status: "DEFERRED_V1_1",
      apiExists: true,
      uiExists: false,
      note: "updateOrderReview API may remain; UI excluded from v1.0 certification",
    },
    buyerReviewHistory: {
      status: "DEFERRED_V1_1",
      note: "Buyer dashboard count-only is not a certified full history surface",
    },
    reviewAnalytics: {
      status: "DEFERRED_V1_1",
      note: "No review analytics module in Cluster 9 v1.0",
    },
    moderationProductWorkflow: {
      status: "DEFERRED_V1_1",
      note: "Policy-only: user delete forbidden; Super Admin may remove (policy)",
    },
  } as const,

  moderationPolicy: {
    userReviewDeletion: "FORBIDDEN",
    superAdminMayRemove: "POLICY_ONLY",
    moderationProductWorkflow: "DEFERRED_V1_1",
    moderationUi: "DEFERRED_V1_1",
    moderationAuditProductFlow: "DEFERRED_V1_1",
    secondReviewAuthorityForbidden: true,
  } as const,

  runtimeRules: {
    reviewsRequireEligibleCompletedOrder: true,
    ratingsCannotBypassAggregation: true,
    reputationCannotBeEditedDirectly: true,
    badgesConsumeReputationOnly: true,
    notificationsOriginateFromReviewAuthorityOnly: true,
    parallelReviewsEngineForbidden: true,
    parallelRatingEngineForbidden: true,
    parallelReputationEngineForbidden: true,
    parallelBadgeEngineForbidden: true,
    alternateReviewPipelineForbidden: true,
    failClosedBoundariesMandatory: true,
  } as const,

  exclusions: {
    sellerReviewCenter: {
      classification: "DIFFERENT_DOMAIN",
      path: "lib/moderation/review-center.ts + features/seller/review-center/**",
      note: "Listing content moderation — not order Reviews Authority",
      canonicalRuntime: false,
    },
    trustReview: {
      classification: "DIFFERENT_DOMAIN",
      path: "features/admin/components/TrustReviewActions.tsx",
      note: "Trust verification review — not order Reviews Authority",
      canonicalRuntime: false,
    },
    withdrawReviewStep: {
      classification: "DIFFERENT_DOMAIN",
      path: "features/wallet/components/withdraw/WithdrawReviewStep.tsx",
      note: "Withdraw wizard step — not order Reviews Authority",
      canonicalRuntime: false,
    },
  } as const,

  legacy: {
    sellerPerformancePublicApi: {
      classification: "COMPATIBILITY_FACADE",
      path: "app/api/seller/performance/[userId]/route.ts",
      note: "Must facade to Reputation public profile — not a second reputation writer",
      canonicalAfterCertification: false,
    },
    detectReviewFraudDualSlotGap: {
      classification: "IMPLEMENTATION_DEFECT",
      path: "lib/trust/anti-fraud.ts",
      note: "Tech Cert gate — align with dual-slot Reviews Authority; do not redesign engines",
      canonicalAfterCertification: true,
    },
    reviewNotificationEventTypeMapping: {
      classification: "IMPLEMENTATION_DEFECT",
      note: "Review notify must not misuse admin_announcement catalog mapping — Tech Cert",
      canonicalAfterCertification: true,
    },
  } as const,

  permanentlyForbidden: [
    "Second Reviews Engine / Rating Engine / Reputation Engine / Badge Engine",
    "Alternate review pipeline outside canonical flow",
    "Direct reputation score edits by user or admin",
    "Badge assignment that bypasses Reputation signals",
    "Review notifications that bypass Review Authority persist",
    "Ratings written without eligible completed order",
    "Promoting deferred v1.1 features into Cluster 9 certification without Owner approval",
    "Treating Seller Review Center / Trust Review / Withdraw review step as Reviews Authority",
    "Making Moderation a second Review Authority",
  ] as const,

  nextGates: [] as const,

  technicalCertificationRequires: [
    "Canonical create path remains store + create_order_review only",
    "detectReviewFraud aligned with seller→buyer dual slot (implementation fix)",
    "Review notification catalog mapping correct (implementation fix)",
    "No parallel reviews/rating/reputation/badge engines introduced",
    "Deferred v1.1 features remain disabled for certification",
    "Legacy seller performance API remains facade-only",
  ] as const,

  ssot: "lib/reviews/cluster-9-reviews-ratings-reputation-scope-lock-v1.ts",
} as const;

export type Cluster9ReviewsRatingsReputationScopeLockV1 =
  typeof CLUSTER_9_REVIEWS_RATINGS_REPUTATION_SCOPE_LOCK_V1;

export function getCluster9ReviewsRatingsReputationScopeLockSnapshot() {
  return CLUSTER_9_REVIEWS_RATINGS_REPUTATION_SCOPE_LOCK_V1;
}

export function assertCluster9ReviewsArchitectureOrBlock(): void {
  const lock = CLUSTER_9_REVIEWS_RATINGS_REPUTATION_SCOPE_LOCK_V1;
  if (!lock.approvedByOwner || !lock.scopeLocked || !lock.architectureCertified) {
    throw new Error("CLUSTER 9 Reviews, Ratings & Reputation Scope Lock is not Owner-approved.");
  }
  if (lock.authorities.review.role !== "SOLE_REVIEW_AUTHORITY") {
    throw new Error("CLUSTER 9 invariant broken: Review Authority must be singular.");
  }
  if (lock.authorities.rating.role !== "SOLE_RATING_AUTHORITY") {
    throw new Error("CLUSTER 9 invariant broken: Rating Authority must be singular.");
  }
  if (lock.authorities.reputation.role !== "SOLE_REPUTATION_AUTHORITY") {
    throw new Error("CLUSTER 9 invariant broken: Reputation Authority must be singular.");
  }
  if (lock.authorities.badge.role !== "SOLE_BADGE_AUTHORITY") {
    throw new Error("CLUSTER 9 invariant broken: Badge Authority must be singular.");
  }
  if (lock.authorities.moderation.status !== "DEFERRED_V1_1") {
    throw new Error("CLUSTER 9 invariant broken: Moderation product must remain DEFERRED_V1_1.");
  }
  if (!lock.runtimeRules.reviewsRequireEligibleCompletedOrder) {
    throw new Error("CLUSTER 9 invariant broken: reviews require eligible completed orders.");
  }
  if (!lock.runtimeRules.reputationCannotBeEditedDirectly) {
    throw new Error("CLUSTER 9 invariant broken: reputation must remain calculated-only.");
  }
}
