import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CLUSTER_9_REVIEWS_RATINGS_REPUTATION_SCOPE_LOCK_V1 } from "@/lib/reviews/cluster-9-reviews-ratings-reputation-scope-lock-v1";
import { getCanonicalNotificationByEventType } from "@/lib/notifications/catalog";

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("Cluster 9 Reviews, Ratings & Reputation Technical Certification", () => {
  const lock = CLUSTER_9_REVIEWS_RATINGS_REPUTATION_SCOPE_LOCK_V1;

  it("marks Owner Visual QA PASS and Production Freeze applied", () => {
    expect(lock.scopeLocked).toBe(true);
    expect(lock.technicalCertificationPass).toBe(true);
    expect(lock.ownerVisualQaPass).toBe(true);
    expect(lock.ownerVisualQa).toBe("PASS");
    expect(lock.freezeApplied).toBe(true);
    expect(lock.productionReady).toBe(true);
    expect(lock.productionStatus).toBe("CERTIFIED");
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
  });

  it("supports both dual-slot review directions in detectReviewFraud", () => {
    const antiFraud = readSource("lib/trust/anti-fraud.ts");
    expect(antiFraud).toContain("buyerReviewsSeller");
    expect(antiFraud).toContain("sellerReviewsBuyer");
    expect(antiFraud).toMatch(/Dual-slot Reviews Authority/);
    expect(antiFraud).not.toMatch(
      /order\.buyer_id !== input\.reviewerId \|\| order\.seller_id !== input\.revieweeId/,
    );
  });

  it("emits review_received from Review Authority — never admin_announcement", () => {
    const store = readSource("lib/reviews/store.ts");
    expect(store).toContain('eventType: "review_received"');
    expect(store).not.toContain('eventType: "admin_announcement"');
    expect(store).toContain("emitSmartNotification");

    const catalog = getCanonicalNotificationByEventType("review_received");
    expect(catalog?.kind).toBe("marketplace.review_received");
    expect(catalog?.dbType).toBe("review");
    expect(catalog?.eventType).toBe("review_received");
  });

  it("keeps canonical create path on store + create_order_review", () => {
    const store = readSource("lib/reviews/store.ts");
    expect(store).toContain("create_order_review");
    expect(store).toContain("export async function createOrderReview");
    expect(store).toContain("onReviewSubmitted");
    expect(lock.authorities.review.rpc).toBe("create_order_review");
  });
});
