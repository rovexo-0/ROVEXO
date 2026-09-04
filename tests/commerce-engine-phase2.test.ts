import { describe, expect, it } from "vitest";

import { COMMERCE_EVENTS, type CommerceEvent } from "@/lib/commerce-engine/events";
import { DELIVERED_RELEASE_HOURS } from "@/lib/commerce-engine/escrow-constants";
import { decideRelease } from "@/lib/commerce-engine/release-policy";

const HOUR = 3600_000;

describe("commerce engine phase 2+3 — canonical event set", () => {
  it("defines every spec event exactly once", () => {
    const expected: CommerceEvent[] = [
      "PAYMENT_CAPTURED",
      "ESCROW_OPENED",
      "PLATFORM_FEE_RESERVED",
      "SHIPPING_RESERVED",
      "LABEL_CREATED",
      "TRACKING_UPDATED",
      "DELIVERED",
      "AUTO_RELEASE",
      "SELLER_AVAILABLE",
      "SELLER_PAID",
      "REFUND_STARTED",
      "REFUND_COMPLETED",
    ];
    expect([...COMMERCE_EVENTS].sort()).toEqual([...expected].sort());
    expect(new Set(COMMERCE_EVENTS).size).toBe(COMMERCE_EVENTS.length);
  });
});

describe("commerce engine phase 2+3 — release gate", () => {
  const now = Date.parse("2026-01-10T12:00:00.000Z");
  const deliveredJustNow = new Date(now - 1 * HOUR).toISOString();
  const delivered25hAgo = new Date(now - 25 * HOUR).toISOString();
  const delivered49hAgo = new Date(now - 49 * HOUR).toISOString();

  it("holds the seller's funds until delivery", () => {
    expect(
      decideRelease({
        status: "awaiting_shipment",
        deliveredAt: null,
        hasRefund: false,
        hasOpenClaim: false,
        requireTimer: true,
        now,
      }),
    ).toBe("not_delivered");
  });

  it("keeps funds pending within the Individual 48h window after delivery", () => {
    expect(
      decideRelease({
        status: "delivered",
        deliveredAt: deliveredJustNow,
        hasRefund: false,
        hasOpenClaim: false,
        requireTimer: true,
        sellerContext: "individual",
        now,
      }),
    ).toBe("within_hold_window");
  });

  it("25h after delivery is still within Individual 48h hold", () => {
    expect(
      decideRelease({
        status: "delivered",
        deliveredAt: delivered25hAgo,
        hasRefund: false,
        hasOpenClaim: false,
        requireTimer: true,
        sellerContext: "individual",
        now,
      }),
    ).toBe("within_hold_window");
  });

  it("auto-releases after delivered + 48h with no claims (Individual)", () => {
    expect(
      decideRelease({
        status: "delivered",
        deliveredAt: delivered49hAgo,
        hasRefund: false,
        hasOpenClaim: false,
        requireTimer: true,
        sellerContext: "individual",
        now,
      }),
    ).toBe("released");
  });

  it("blocks payout when a claim is open", () => {
    expect(
      decideRelease({
        status: "issue_open",
        deliveredAt: delivered49hAgo,
        hasRefund: false,
        hasOpenClaim: true,
        requireTimer: true,
        now,
      }),
    ).toBe("claim_open");

    expect(
      decideRelease({
        status: "delivered",
        deliveredAt: delivered49hAgo,
        hasRefund: false,
        hasOpenClaim: true,
        requireTimer: true,
        now,
      }),
    ).toBe("claim_open");
  });

  it("blocks payout when a refund exists", () => {
    expect(
      decideRelease({
        status: "delivered",
        deliveredAt: delivered49hAgo,
        hasRefund: true,
        hasOpenClaim: false,
        requireTimer: true,
        now,
      }),
    ).toBe("refund_present");
  });

  it("never releases a cancelled order", () => {
    expect(
      decideRelease({
        status: "cancelled",
        deliveredAt: delivered49hAgo,
        hasRefund: false,
        hasOpenClaim: false,
        requireTimer: true,
        now,
      }),
    ).toBe("cancelled");
  });

  it("releases immediately when the buyer confirms delivery", () => {
    expect(
      decideRelease({
        status: "completed",
        deliveredAt: deliveredJustNow,
        hasRefund: false,
        hasOpenClaim: false,
        requireTimer: false,
        now,
      }),
    ).toBe("released");
  });

  it("never releases a refunded seller sale after order completion", () => {
    expect(
      decideRelease({
        status: "completed",
        deliveredAt: deliveredJustNow,
        hasRefund: true,
        hasOpenClaim: false,
        saleRefunded: true,
        requireTimer: false,
        now,
      }),
    ).toBe("sale_refunded");
  });
});

describe("commerce engine phase 2+3 — constants", () => {
  it("uses Individual 48h as DELIVERED_RELEASE_HOURS alias", () => {
    expect(DELIVERED_RELEASE_HOURS).toBe(48);
  });
});
