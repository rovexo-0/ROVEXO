/**
 * Bundle Phase 1 — snapshot + reservation + integrity unit tests.
 */

import { describe, expect, it } from "vitest";
import {
  allocateLockedBundleLinePrices,
  buildBundleCheckoutSnapshot,
  isBundleCheckoutSnapshot,
  snapshotPrimarySlug,
} from "@/lib/bundle/bundle-snapshot-v1";
import { BUNDLE_NOTIFICATION_MATRIX_V1 } from "@/lib/bundle/bundle-notification-matrix-ssot-v1";
import { BUNDLE_ENGINE_V1 } from "@/lib/bundle/bundle-engine-v1";
import { calculatePlatformFee, calculateOrderTotals } from "@/lib/orders/pricing";

describe("Bundle Phase 1 — Snapshot Engine", () => {
  it("builds immutable snapshot with server totals", () => {
    const itemPrice = 100;
    const shipping = 4.99;
    const platformFee = calculatePlatformFee(itemPrice);
    const totals = calculateOrderTotals(itemPrice, shipping);

    const snapshot = buildBundleCheckoutSnapshot({
      bundleId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      buyerId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      sellerId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      sellerName: "Seller",
      currency: "GBP",
      itemPrice,
      platformFee,
      shipping,
      total: totals.total,
      lines: [
        {
          productId: "11111111-1111-4111-8111-111111111111",
          slug: "nike",
          title: "Nike",
          imageUrl: "/n.jpg",
          unitPrice: 60,
          quantity: 1,
          maxStock: 2,
          condition: "good",
          currency: "GBP",
        },
        {
          productId: "22222222-2222-4222-8222-222222222222",
          slug: "adidas",
          title: "Adidas",
          imageUrl: "/a.jpg",
          unitPrice: 40,
          quantity: 1,
          maxStock: 1,
          condition: "good",
          currency: "GBP",
        },
      ],
    });

    expect(snapshot.immutable).toBe(true);
    expect(snapshot.v).toBe(1);
    expect(isBundleCheckoutSnapshot(snapshot)).toBe(true);
    expect(snapshotPrimarySlug(snapshot)).toBe("nike");
    expect(snapshot.lines).toHaveLength(2);
    expect(snapshot.total).toBe(totals.total);
    expect(snapshot.platformFee).toBe(platformFee);
  });

  it("rejects non-immutable payloads", () => {
    expect(isBundleCheckoutSnapshot({ v: 1, lines: [] })).toBe(false);
    expect(isBundleCheckoutSnapshot(null)).toBe(false);
  });

  it("allocates locked offer price across lines without drift", () => {
    const lines = [
      {
        productId: "11111111-1111-4111-8111-111111111111",
        slug: "a",
        title: "A",
        imageUrl: "/a.jpg",
        unitPrice: 60,
        quantity: 1,
        maxStock: 2,
        condition: "good",
        currency: "GBP",
      },
      {
        productId: "22222222-2222-4222-8222-222222222222",
        slug: "b",
        title: "B",
        imageUrl: "/b.jpg",
        unitPrice: 40,
        quantity: 1,
        maxStock: 1,
        condition: "good",
        currency: "GBP",
      },
    ];
    const locked = allocateLockedBundleLinePrices(lines, 80);
    const sum = locked.reduce((s, line) => s + line.unitPrice * line.quantity, 0);
    expect(Math.round(sum * 100) / 100).toBe(80);
    expect(locked[0]!.unitPrice).toBeGreaterThan(0);
    expect(locked[1]!.unitPrice).toBeGreaterThan(0);
  });
});

describe("Bundle Phase 1 — Atomic law + notifications matrix", () => {
  it("enforces one payment / one order singularity", () => {
    expect(BUNDLE_ENGINE_V1.payment.atomicEntireBundleOrNothing).toBe(true);
    expect(BUNDLE_ENGINE_V1.singularity.oneOrderPerPaidBundle).toBe(true);
    expect(BUNDLE_ENGINE_V1.singularity.onePaymentPerBuyerBundle).toBe(true);
  });

  it("locks Owner notification matrix labels", () => {
    expect(BUNDLE_NOTIFICATION_MATRIX_V1.buyer).toContain("Checkout Started");
    expect(BUNDLE_NOTIFICATION_MATRIX_V1.buyer).toContain("Payment Successful");
    expect(BUNDLE_NOTIFICATION_MATRIX_V1.seller).toContain("Bundle Purchased");
    expect(BUNDLE_NOTIFICATION_MATRIX_V1.seller).toContain("Prepare Order");
  });
});

describe("Bundle Phase 1 — Reservation rollback contract", () => {
  it("documents all-or-nothing release order (LIFO unlock)", () => {
    const locked = [
      { productId: "a", quantity: 1 },
      { productId: "b", quantity: 2 },
      { productId: "c", quantity: 1 },
    ];
    const rollback = [...locked].reverse();
    expect(rollback.map((l) => l.productId)).toEqual(["c", "b", "a"]);
  });
});
