import { describe, expect, it } from "vitest";

import { COMMERCE_EVENTS } from "@/lib/commerce-engine/events";
import { DELIVERED_RELEASE_HOURS } from "@/lib/commerce-engine/escrow-constants";
import { decideRelease } from "@/lib/commerce-engine/release-policy";

const HOUR = 3600_000;

describe("resolution engine — release policy integration", () => {
  it("blocks auto-release when a resolution claim is active", () => {
    expect(
      decideRelease({
        status: "issue_open",
        deliveredAt: new Date(Date.now() - 25 * HOUR).toISOString(),
        hasRefund: false,
        hasOpenClaim: true,
        requireTimer: true,
      }),
    ).toBe("claim_open");
  });
});

describe("resolution engine — commerce event coverage", () => {
  it("includes events required for automated resolution triggers", () => {
    const required = ["DELIVERED", "REFUND_STARTED", "REFUND_COMPLETED", "TRACKING_UPDATED"];
    for (const event of required) {
      expect(COMMERCE_EVENTS).toContain(event);
    }
  });
});

describe("resolution engine — delivery window", () => {
  it("uses 24h post-delivery for auto-close alignment", () => {
    expect(DELIVERED_RELEASE_HOURS).toBe(24);
  });
});
