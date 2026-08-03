import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLUSTER_9_REVIEWS_RATINGS_REPUTATION_SCOPE_LOCK_V1,
  assertCluster9ReviewsArchitectureOrBlock,
} from "@/lib/reviews/cluster-9-reviews-ratings-reputation-scope-lock-v1";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Cluster 9 Reviews, Ratings & Reputation Scope Lock", () => {
  const lock = CLUSTER_9_REVIEWS_RATINGS_REPUTATION_SCOPE_LOCK_V1;

  it("is Owner-approved architecture Scope Locked (not Production Freeze)", () => {
    expect(lock.approvedByOwner).toBe(true);
    expect(lock.scopeLocked).toBe(true);
    expect(lock.architectureCertified).toBe(true);
    expect(lock.cluster).toBe("CLUSTER_9_REVIEWS_RATINGS_REPUTATION");
    expect(lock.productionReady).toBe(true);
    expect(lock.freezeApplied).toBe(true);
    expect(lock.technicalCertificationPass).toBe(true);
    expect(lock.ownerVisualQaPass).toBe(true);
    expect(lock.ownerVisualQa).toBe("PASS");
    expect(lock.productionStatus).toBe("CERTIFIED");
    expect(lock.authorities.review.role).toBe("SOLE_REVIEW_AUTHORITY");
    expect(lock.authorities.rating.role).toBe("SOLE_RATING_AUTHORITY");
    expect(lock.authorities.reputation.role).toBe("SOLE_REPUTATION_AUTHORITY");
    expect(lock.authorities.badge.role).toBe("SOLE_BADGE_AUTHORITY");
    expect(lock.authorities.moderation.status).toBe("DEFERRED_V1_1");
    expect(lock.canonicalReviewFlow).toEqual([
      "COMPLETED_ORDER",
      "ELIGIBILITY_CHECK",
      "REVIEW_AUTHORITY",
      "RATING_AGGREGATION",
      "REPUTATION_ENGINE",
      "BADGE_ENGINE",
      "EMIT_SMART_NOTIFICATION",
      "PUBLIC_PROFILE_OR_LISTING",
    ]);
    expect(lock.enabledV1).toEqual(
      expect.arrayContaining([
        "Buyer → Seller reviews",
        "Seller → Buyer reviews",
        "Verified Purchase",
        "Public ratings",
        "Reputation score",
        "Reputation badges",
        "Review notifications",
        "Public review display",
      ]),
    );
    expect(lock.deferredToV1_1).toEqual(
      expect.arrayContaining([
        "Review report flow",
        "Review moderation UI",
        "Review reply UI",
        "Review edit UI",
        "Buyer review history",
        "Review analytics",
      ]),
    );
    assertCluster9ReviewsArchitectureOrBlock();
  });

  it("locks singular review / rating / reputation / badge authorities without parallel engines", () => {
    const reviewsEngine = readSource("lib/reviews/reviews-engine-v1.ts");
    expect(reviewsEngine).toContain("REVIEWS_ENGINE_V1");
    expect(reviewsEngine).toContain("lib/reviews/store.ts");
    expect(reviewsEngine).toContain("NO_COMPLETED_TRANSACTION_NO_REVIEW");

    const store = readSource("lib/reviews/store.ts");
    expect(store).toContain("export async function createOrderReview");
    expect(store).toContain("create_order_review");
    expect(store).toContain("emitSmartNotification");
    expect(lock.authorities.review.rpc).toBe("create_order_review");

    const rating = readSource("lib/rating/rating-engine-v1.ts");
    expect(rating).toContain("RATING_ENGINE_V1");
    expect(rating).toContain("NO_COMPLETED_TRANSACTION_NO_RATING");

    const reputation = readSource("lib/reputation/reputation-engine-v1.ts");
    expect(reputation).toContain("REPUTATION_ENGINE_V1");
    expect(reputation).toContain("lib/seller-performance");
    expect(reputation).toContain("REPUTATION_IS_CALCULATED_NEVER_MANUALLY_EDITED");

    const badge = readSource("lib/badge/badge-engine-v1.ts");
    expect(badge).toContain("BADGE_ENGINE_V1");
    expect(badge).toContain("lib/reputation/store.ts");

    expect(lock.runtimeRules.parallelReviewsEngineForbidden).toBe(true);
    expect(lock.runtimeRules.parallelRatingEngineForbidden).toBe(true);
    expect(lock.runtimeRules.parallelReputationEngineForbidden).toBe(true);
    expect(lock.runtimeRules.parallelBadgeEngineForbidden).toBe(true);
  });

  it("locks moderation as deferred policy-only and excludes foreign domains", () => {
    expect(lock.moderationPolicy.userReviewDeletion).toBe("FORBIDDEN");
    expect(lock.moderationPolicy.superAdminMayRemove).toBe("POLICY_ONLY");
    expect(lock.moderationPolicy.moderationProductWorkflow).toBe("DEFERRED_V1_1");
    expect(lock.moderationPolicy.moderationUi).toBe("DEFERRED_V1_1");
    expect(lock.moderationPolicy.secondReviewAuthorityForbidden).toBe(true);

    expect(lock.exclusions.sellerReviewCenter.canonicalRuntime).toBe(false);
    expect(lock.exclusions.trustReview.canonicalRuntime).toBe(false);
    expect(lock.exclusions.withdrawReviewStep.canonicalRuntime).toBe(false);

    const superAdminReviews = readSource("app/(platform)/super-admin/reviews/page.tsx");
    expect(superAdminReviews).toMatch(/rolling out|next platform release/i);
  });

  it("records Technical Certification gates after freeze (implementation gates retained)", () => {
    expect(lock.nextGates).toEqual([]);
    expect(lock.technicalCertificationRequires.length).toBeGreaterThan(0);
    expect(lock.technicalCertificationRequires).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/detectReviewFraud/),
        expect.stringMatching(/notification catalog mapping/i),
      ]),
    );
    expect(lock.runtimeRules.reviewsRequireEligibleCompletedOrder).toBe(true);
    expect(lock.runtimeRules.reputationCannotBeEditedDirectly).toBe(true);
    expect(lock.runtimeRules.badgesConsumeReputationOnly).toBe(true);
    expect(lock.runtimeRules.notificationsOriginateFromReviewAuthorityOnly).toBe(true);
  });
});
