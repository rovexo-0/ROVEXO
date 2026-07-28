import { describe, expect, it } from "vitest";
import {
  SELF_PURCHASE_ABSOLUTE_LAW_V1,
  isSelfPurchaseBlocked,
} from "@/lib/checkout/self-purchase-absolute-law-v1";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("Self-Purchase Absolute Law v1.0 — User Singularity", () => {
  it("locks only-user and canonical compare", () => {
    expect(SELF_PURCHASE_ABSOLUTE_LAW_V1.equation).toBe("THERE_IS_ONLY_USER_ACCOUNT");
    expect(SELF_PURCHASE_ABSOLUTE_LAW_V1.canonicalSelfPurchaseCompare).toBe(
      "currentUser.id === listing.owner.id",
    );
    expect(SELF_PURCHASE_ABSOLUTE_LAW_V1.forbiddenSelfPurchaseCompare).toContain(
      "buyerId == sellerId",
    );
    expect(isSelfPurchaseBlocked({ currentUserId: "u1", listingOwnerId: "u1" })).toBe(true);
    expect(isSelfPurchaseBlocked({ currentUserId: "u1", listingOwnerId: "u2" })).toBe(false);
    expect(isSelfPurchaseBlocked({ currentUserId: "u1", listingOwnerId: null })).toBe(true);
  });

  it("engine uses canonical self-purchase helper — not buyerId==sellerId", () => {
    const engine = readFileSync(
      path.join(process.cwd(), "lib/checkout/engines/buy-now-engine-v1.ts"),
      "utf8",
    );
    expect(engine).toContain("isSelfPurchaseBlocked");
    expect(engine).toContain("currentUserId");
    expect(engine).toContain("listingOwnerId");
    expect(engine).not.toMatch(/sellerId === input\.buyerId/);
    expect(engine).not.toMatch(/input\.buyerId === sellerId/);
  });
});
