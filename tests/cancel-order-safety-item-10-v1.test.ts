/**
 * Deploy Item #10 — Cancel Order safety / multi-carrier certification.
 * Carrier-independent. Uses selectCurrentOrderParcels (same SSOT as Item #9).
 * No Production writes · no Stripe LIVE · no parallel cancel engine.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  evaluateBuyerCancellationEligibility,
  evaluateSellerCancellationEligibility,
  isHistoricalParcelProtectedFromCancel,
  mayAdvanceOrderStatusFromShipping,
  resolveCancellationShipmentGate,
} from "@/lib/orders/cancellation";
import {
  extractActiveOrderDisplayCarriers,
  resolveOrderDisplayCarrier,
} from "@/lib/orders/resolve-order-display-carrier-v1";
import { canPerformOrderAction } from "@/lib/orders/role";
import type { Order } from "@/lib/orders/types";
import {
  selectCurrentOrderParcels,
} from "@/lib/shipping/resolve-shipment-parcel-for-label-v1";
import { SHIPPING_RECORDS_SSOT_V1 } from "@/lib/shipping/shipping-records-ssot-v1";
import type { ShipmentParcel } from "@/lib/shipping/types";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

function parcel(
  overrides: Partial<ShipmentParcel> &
    Pick<ShipmentParcel, "id" | "parcelNumber" | "carrier" | "status">,
): ShipmentParcel {
  return {
    shippingRecordId: "ship-1",
    totalParcels: 2,
    weightKg: 1,
    dimensions: null,
    shippingService: null,
    trackingNumber: null,
    trackingUrl: null,
    productItemIds: ["prod-1"],
    insuranceEnabled: false,
    insuranceValueGbp: null,
    operation: null,
    estimatedDeliveryAt: null,
    label: null,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

function baseOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    orderNumber: "RVX-ITEM10",
    status: "awaiting_shipment",
    product: {
      id: "p1",
      slug: "item",
      title: "Test item",
      price: 50,
      imageUrl: "/placeholder-product.svg",
      condition: "new",
    },
    buyer: { id: "buyer-1", name: "Buyer" },
    seller: { id: "seller-1", name: "Seller" },
    totals: { itemPrice: 45, platformFee: 5, delivery: 5, total: 50 },
    deliveryCarrier: "InPost",
    createdAt: "2026-07-01T10:00:00Z",
    paidAt: "2026-07-01T10:05:00Z",
    disputesDisabled: false,
    ...overrides,
  };
}

const historicalInPost = parcel({
  id: "hist-inpost",
  parcelNumber: 4,
  carrier: "InPost",
  status: "failed",
  trackingNumber: "INPOST-OLD",
  label: { id: "l-old", pdfUrl: null, labelUrl: null, status: "void" },
  providerParcelId: 111,
});

const historicalEvriVoid = parcel({
  id: "hist-evri",
  parcelNumber: 1,
  carrier: "Evri",
  status: "cancelled",
  trackingNumber: "HEVRIOLD",
  label: { id: "l-evri", pdfUrl: null, labelUrl: null, status: "void" },
  providerParcelId: 333,
});

const activeRoyalMailReady = parcel({
  id: "live-rm",
  parcelNumber: 5,
  carrier: "Royal Mail",
  status: "preparing",
  trackingNumber: "MZACTIVEGB",
  shippingService: "royal_mailv2:tracked_48/size=s",
  label: {
    id: "l-rm",
    pdfUrl: "/rm.pdf",
    labelUrl: "/rm.pdf",
    status: "ready",
  },
  providerParcelId: 222,
});

const activeRoyalMailNoLabel = parcel({
  id: "live-rm-prep",
  parcelNumber: 2,
  carrier: "Royal Mail",
  status: "preparing",
  trackingNumber: null,
  label: null,
  providerParcelId: undefined,
});

describe("ITEM 10 — single-carrier cancellable order", () => {
  it("buyer + seller allowed when awaiting_shipment with no ready label", () => {
    const single = parcel({
      id: "one",
      parcelNumber: 1,
      carrier: "Evri",
      status: "preparing",
      label: null,
    });
    const gate = resolveCancellationShipmentGate({
      shippingRecordStatus: "preparing",
      parcels: [single],
    });
    expect(gate.hasReadyLabel).toBe(false);
    expect(gate.parcelIdsToVoid).toEqual(["one"]);
    expect(
      evaluateBuyerCancellationEligibility({
        status: "awaiting_shipment",
        ...gate,
      }).allowed,
    ).toBe(true);
    expect(
      evaluateSellerCancellationEligibility({
        status: "awaiting_shipment",
        shippingRecordStatus: gate.shippingRecordStatus,
        parcelStatuses: gate.parcelStatuses,
      }).allowed,
    ).toBe(true);
  });
});

describe("ITEM 10 — recovered multi-carrier cancel selection", () => {
  it("selects only current Royal Mail parcel — not historical InPost", () => {
    const parcels = [historicalInPost, activeRoyalMailReady];
    expect(selectCurrentOrderParcels(parcels).map((p) => p.id)).toEqual(["live-rm"]);
    expect(isHistoricalParcelProtectedFromCancel(historicalInPost)).toBe(true);

    const gate = resolveCancellationShipmentGate({
      shippingRecordStatus: "preparing",
      shippingRecordTracking: "INPOST-OLD",
      parcels,
    });
    expect(gate.providerParcelIds).toEqual(["222"]);
    expect(gate.providerParcelIds).not.toContain("111");
    expect(gate.parcelIdsToVoid).toEqual(["live-rm"]);
    expect(gate.parcelIdsToVoid).not.toContain("hist-inpost");
    expect(gate.hasReadyLabel).toBe(true);
  });

  it("active carrier display remains Royal Mail while cancel gate ignores history", () => {
    const parcels = [historicalInPost, activeRoyalMailReady];
    const active = extractActiveOrderDisplayCarriers(parcels);
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: "InPost",
        shippingRecordCarrier: "InPost",
        ...active,
      }),
    ).toBe("Royal Mail");
    const gate = resolveCancellationShipmentGate({
      shippingRecordStatus: "collected",
      shippingRecordTracking: "INPOST-OLD",
      parcels,
    });
    // Mismatched historical record tracking must not authorize cancel via stale collected.
    expect(gate.shippingRecordStatus).toBe("preparing");
    expect(gate.providerParcelIds).toEqual(["222"]);
  });

  it("multiple historical labels: void/cancel lists contain only current parcel", () => {
    const gate = resolveCancellationShipmentGate({
      shippingRecordStatus: "preparing",
      shippingRecordTracking: "MZACTIVEGB",
      parcels: [historicalEvriVoid, historicalInPost, activeRoyalMailReady],
    });
    expect(gate.parcelIdsToVoid).toEqual(["live-rm"]);
    expect(gate.providerParcelIds).toEqual(["222"]);
    expect(gate.hasReadyLabel).toBe(true);
  });

  it("buyer blocked when current parcel has ready label (RVX8343A7C7 shape)", () => {
    const gate = resolveCancellationShipmentGate({
      shippingRecordStatus: "preparing",
      shippingRecordTracking: "MZACTIVEGB",
      parcels: [historicalInPost, activeRoyalMailReady],
    });
    const buyer = evaluateBuyerCancellationEligibility({
      status: "awaiting_shipment",
      ...gate,
    });
    expect(buyer.allowed).toBe(false);
    expect(buyer.reason).toMatch(/label/i);
  });

  it("seller may cancel pre-collection even with ready current label (certified policy)", () => {
    const gate = resolveCancellationShipmentGate({
      shippingRecordStatus: "preparing",
      shippingRecordTracking: "MZACTIVEGB",
      parcels: [historicalInPost, activeRoyalMailReady],
    });
    expect(
      evaluateSellerCancellationEligibility({
        status: "awaiting_shipment",
        shippingRecordStatus: gate.shippingRecordStatus,
        parcelStatuses: gate.parcelStatuses,
      }).allowed,
    ).toBe(true);
  });

  it("no active parcel: empty current set — no void/provider cancel targets", () => {
    const gate = resolveCancellationShipmentGate({
      shippingRecordStatus: "failed",
      parcels: [historicalInPost, historicalEvriVoid],
    });
    expect(selectCurrentOrderParcels([historicalInPost, historicalEvriVoid])).toEqual([]);
    expect(gate.parcelIdsToVoid).toEqual([]);
    expect(gate.providerParcelIds).toEqual([]);
    expect(gate.hasReadyLabel).toBe(false);
  });

  it("active preparing parcel without label remains buyer-cancellable", () => {
    const gate = resolveCancellationShipmentGate({
      shippingRecordStatus: "preparing",
      parcels: [historicalInPost, activeRoyalMailNoLabel],
    });
    expect(gate.hasReadyLabel).toBe(false);
    expect(gate.parcelIdsToVoid).toEqual(["live-rm-prep"]);
    expect(
      evaluateBuyerCancellationEligibility({
        status: "awaiting_shipment",
        ...gate,
      }).allowed,
    ).toBe(true);
  });
});

describe("ITEM 10 — order / auth / payment / idempotency guards", () => {
  it("already cancelled, delivered, shipped fail closed", () => {
    expect(
      evaluateBuyerCancellationEligibility({
        status: "cancelled",
        shippingRecordStatus: null,
        parcelStatuses: [],
        hasReadyLabel: false,
      }).allowed,
    ).toBe(false);
    expect(
      evaluateBuyerCancellationEligibility({
        status: "delivered",
        shippingRecordStatus: "delivered",
        parcelStatuses: ["delivered"],
        hasReadyLabel: false,
      }).allowed,
    ).toBe(false);
    expect(
      evaluateSellerCancellationEligibility({
        status: "shipped",
        shippingRecordStatus: null,
        parcelStatuses: [],
      }).allowed,
    ).toBe(false);
  });

  it("unauthorized buyer/seller blocked by role actions", () => {
    const order = baseOrder();
    expect(canPerformOrderAction("cancel", order, "buyer-1")).toBe(true);
    expect(canPerformOrderAction("cancel", order, "seller-1")).toBe(true);
    expect(canPerformOrderAction("cancel", order, "stranger")).toBe(false);
  });

  it("in-transit / collected blocks both actors", () => {
    expect(
      evaluateBuyerCancellationEligibility({
        status: "awaiting_shipment",
        shippingRecordStatus: "in_transit",
        parcelStatuses: ["in_transit"],
        hasReadyLabel: false,
      }).allowed,
    ).toBe(false);
    expect(
      evaluateSellerCancellationEligibility({
        status: "awaiting_shipment",
        shippingRecordStatus: "collected",
        parcelStatuses: ["collected"],
      }).allowed,
    ).toBe(false);
  });

  it("stale webhook cannot promote cancelled order", () => {
    expect(
      mayAdvanceOrderStatusFromShipping({
        orderStatus: "cancelled",
        shippingStatus: "delivered",
      }),
    ).toBe(false);
  });

  it("cancel server: ownership, claim idempotency, refund-before-carrier, current parcel only", () => {
    const cancel = read("lib/orders/cancel-order.server.ts");
    const store = read("lib/orders/store.ts");
    const cancellation = read("lib/orders/cancellation.ts");

    expect(cancel).toContain("resolveCancellationShipmentGate");
    expect(cancel).toContain("parcelIdsToVoid");
    expect(cancel).toContain("providerParcelIds");
    expect(cancel).toContain("claimOrderCancellation");
    expect(cancel).toContain("cancel_claim_key");
    expect(cancel).toContain("releaseOrderCancellationClaim");
    expect(cancel).toContain("refundCapturedPaymentOrZero");
    expect(cancel).toContain("cancelSendcloudParcels");
    // Call-site order inside cancelBuyerOrder (not helper declaration order).
    const buyerFn = cancel.slice(cancel.indexOf("export async function cancelBuyerOrder"));
    expect(buyerFn.indexOf("await refundCapturedPaymentOrZero")).toBeGreaterThan(-1);
    expect(buyerFn.indexOf("await cancelSendcloudParcels")).toBeGreaterThan(-1);
    expect(buyerFn.indexOf("await refundCapturedPaymentOrZero")).toBeLessThan(
      buyerFn.indexOf("await cancelSendcloudParcels"),
    );
    expect(cancel).not.toContain('from("order_shipments")');
    expect(cancel).not.toContain("appendShipmentParcel");

    expect(cancellation).toContain("selectCurrentOrderParcels");
    expect(cancellation).toContain("isFailedHistoricalParcel");

    expect(store).toContain('error: "Forbidden."');
    expect(store).toContain("actorUserId === existing.seller.id");
    expect(store).toContain("actorUserId === existing.buyer.id");
    expect(store).toContain('throw new Error("Unauthorized.")');
  });

  it("shipping_records remains SSOT — no second cancel engine", () => {
    expect(SHIPPING_RECORDS_SSOT_V1.canonicalTable).toBe("shipping_records");
    const cancel = read("lib/orders/cancel-order.server.ts");
    expect(cancel).toContain("getShippingRecord");
    expect(cancel).toContain("updateShippingRecordStatus");
    expect(cancel).not.toContain("createCancellationEngine");
    expect(cancel).not.toContain("CancelOrderV2");
  });

  it("Hub buyer gate uses hasShippingLabel; Item #9 active carrier wiring preserved", () => {
    const hub = read("features/inbox/components/ConversationHub.tsx");
    const detail = read("features/orders/components/OrderDetailView.tsx");
    expect(hub).toContain("!hasShippingLabel");
    expect(hub).toContain("activeLabelCarrier={activeShippingLabel?.carrier ?? null}");
    expect(detail).toContain(
      "activeLabelCarrier: extracted.activeLabelCarrier || activeLabelCarrier",
    );
  });
});
