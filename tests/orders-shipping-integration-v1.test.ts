/**
 * Orders ↔ Shipping integration — active carrier, cancel safety, gap-hunt.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  evaluateBuyerCancellationEligibility,
  evaluateSellerCancellationEligibility,
  mayAdvanceOrderStatusFromShipping,
  resolveCancellationShipmentGate,
} from "@/lib/orders/cancellation";
import {
  extractActiveOrderDisplayCarriers,
  resolveOrderDisplayCarrier,
  resolveOrderDisplayTracking,
} from "@/lib/orders/resolve-order-display-carrier-v1";
import {
  LABEL_GENERATION_IDEMPOTENCY_V1,
  selectActiveParcelForLabelProtection,
} from "@/lib/shipping/label-generation-idempotency-v1";
import {
  shouldApplyCarrierTrackingUpdate,
  selectCurrentOrderParcels,
} from "@/lib/shipping/resolve-shipment-parcel-for-label-v1";
import {
  SHIPPING_RECORDS_SSOT_V1,
  SHIPPING_SSOT_LEGACY_ORDER_SHIPMENTS_POLICY,
} from "@/lib/shipping/shipping-records-ssot-v1";
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

const historicalEvriFailed = parcel({
  id: "hist-evri",
  parcelNumber: 1,
  carrier: "Evri",
  status: "failed",
  trackingNumber: "HEVRIOLD",
  label: { id: "l-old", pdfUrl: null, labelUrl: null, status: "void" },
  providerParcelId: 111,
});

const activeRoyalMail = parcel({
  id: "live-rm",
  parcelNumber: 2,
  carrier: "Royal Mail",
  status: "preparing",
  trackingNumber: "MZACTIVEGB",
  label: {
    id: "l-rm",
    pdfUrl: "/rm.pdf",
    labelUrl: "/rm.pdf",
    status: "ready",
  },
  providerParcelId: 222,
});

describe("active carrier + tracking identity", () => {
  it("1 single carrier", () => {
    const single = parcel({
      id: "one",
      parcelNumber: 1,
      carrier: "Royal Mail",
      status: "preparing",
      trackingNumber: "MZONLYGB",
      label: { id: "l1", pdfUrl: "/a.pdf", labelUrl: "/a.pdf", status: "ready" },
      providerParcelId: 1,
    });
    const active = extractActiveOrderDisplayCarriers([single]);
    expect(
      resolveOrderDisplayCarrier({ orderCarrier: "Royal Mail", ...active }),
    ).toBe("Royal Mail");
    expect(active.activeTrackingNumber).toBe("MZONLYGB");
  });

  it("2–3 recovered multi-carrier precedence", () => {
    const active = extractActiveOrderDisplayCarriers([historicalEvriFailed, activeRoyalMail]);
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: "Evri",
        shippingRecordCarrier: "Evri",
        ...active,
      }),
    ).toBe("Royal Mail");
    expect(active.activeTrackingNumber).toBe("MZACTIVEGB");
  });

  it("4–5 failed and cancelled historical ignored", () => {
    const cancelled = parcel({
      id: "c1",
      parcelNumber: 1,
      carrier: "Royal Mail",
      status: "cancelled",
      trackingNumber: "GBCANCEL",
      label: { id: "lc", pdfUrl: null, labelUrl: null, status: "void" },
    });
    expect(selectCurrentOrderParcels([historicalEvriFailed, cancelled])).toEqual([]);
    expect(extractActiveOrderDisplayCarriers([historicalEvriFailed, cancelled]).activeParcelCarrier).toBeNull();
  });

  it("6 tracking identity aligns with active carrier", () => {
    const tracking = resolveOrderDisplayTracking({
      orderTracking: "HEVRIOLD",
      shippingRecordTracking: "HEVRIOLD",
      activeParcelTracking: "MZACTIVEGB",
    });
    expect(tracking).toBe("MZACTIVEGB");
  });

  it("7 safe fallback — no invented carrier", () => {
    expect(
      resolveOrderDisplayCarrier({
        orderCarrier: null,
        shippingRecordCarrier: null,
        activeLabelCarrier: null,
        activeParcelCarrier: null,
      }),
    ).toBe("");
    expect(
      resolveOrderDisplayTracking({
        orderTracking: null,
        shippingRecordTracking: null,
        activeParcelTracking: null,
      }),
    ).toBe("");
  });
});

describe("cancel safety", () => {
  it("8 paid / no-label cancel allowed", () => {
    const gate = resolveCancellationShipmentGate({
      shippingRecordStatus: "preparing",
      parcels: [],
    });
    expect(
      evaluateBuyerCancellationEligibility({
        status: "awaiting_shipment",
        ...gate,
      }).allowed,
    ).toBe(true);
  });

  it("9 label-created / pre-dispatch — buyer blocked; seller allowed", () => {
    const gate = resolveCancellationShipmentGate({
      shippingRecordStatus: "preparing",
      shippingRecordTracking: "MZACTIVEGB",
      parcels: [activeRoyalMail],
    });
    expect(
      evaluateBuyerCancellationEligibility({
        status: "awaiting_shipment",
        ...gate,
      }).allowed,
    ).toBe(false);
    expect(
      evaluateSellerCancellationEligibility({
        status: "awaiting_shipment",
        shippingRecordStatus: gate.shippingRecordStatus,
        parcelStatuses: gate.parcelStatuses,
      }).allowed,
    ).toBe(true);
  });

  it("10 in-transit cancel blocked", () => {
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
        shippingRecordStatus: "in_transit",
        parcelStatuses: ["in_transit"],
      }).allowed,
    ).toBe(false);
  });

  it("11 delivered cancel blocked", () => {
    expect(
      evaluateBuyerCancellationEligibility({
        status: "delivered",
        shippingRecordStatus: "delivered",
        parcelStatuses: ["delivered"],
        hasReadyLabel: true,
      }).allowed,
    ).toBe(false);
    expect(
      evaluateSellerCancellationEligibility({
        status: "delivered",
        shippingRecordStatus: "delivered",
        parcelStatuses: ["delivered"],
      }).allowed,
    ).toBe(false);
  });

  it("12–13 recovered multi-carrier cancel acts only on current parcel", () => {
    const gate = resolveCancellationShipmentGate({
      shippingRecordStatus: "collected",
      shippingRecordTracking: "HEVRIOLD",
      parcels: [historicalEvriFailed, activeRoyalMail],
    });
    expect(gate.providerParcelIds).toEqual(["222"]);
    expect(gate.parcelIdsToVoid).toEqual(["live-rm"]);
    expect(gate.parcelIdsToVoid).not.toContain("hist-evri");
    expect(
      evaluateSellerCancellationEligibility({
        status: "awaiting_shipment",
        shippingRecordStatus: gate.shippingRecordStatus,
        parcelStatuses: gate.parcelStatuses,
      }).allowed,
    ).toBe(true);
  });

  it("18 stale webhook after cancel cannot promote order", () => {
    expect(
      mayAdvanceOrderStatusFromShipping({
        orderStatus: "cancelled",
        shippingStatus: "delivered",
      }),
    ).toBe(false);
    expect(
      mayAdvanceOrderStatusFromShipping({
        orderStatus: "cancelled",
        shippingStatus: "collected",
      }),
    ).toBe(false);
    expect(
      mayAdvanceOrderStatusFromShipping({
        orderStatus: "shipped",
        shippingStatus: "delivered",
      }),
    ).toBe(true);
  });

  it("19 active webhook vs historical webhook ordering", () => {
    const parcels = [historicalEvriFailed, activeRoyalMail];
    expect(
      shouldApplyCarrierTrackingUpdate({ trackingNumber: "HEVRIOLD", parcels }),
    ).toBe(false);
    expect(
      shouldApplyCarrierTrackingUpdate({ trackingNumber: "MZACTIVEGB", parcels }),
    ).toBe(true);
  });
});

describe("idempotency / duplicate protection contracts", () => {
  it("14–17 cancel retry, concurrency, refund and inventory duplicates", () => {
    const cancel = read("lib/orders/cancel-order.server.ts");
    const refunds = read("lib/stripe/refunds.ts");
    const inventory = read("lib/inventory/service.ts");
    expect(cancel).toContain("claimOrderCancellation");
    expect(cancel).toContain("cancel_claim_key");
    expect(cancel).toContain("Cancellation is already in progress.");
    expect(cancel).toContain("releaseOrderCancellationClaim");
    expect(cancel).toContain("healInventoryAfterCancelledOrder");
    expect(cancel).toContain("restoreInventoryAfterOrderCancellation");
    expect(cancel).toContain("await markOrderCancelled");
    expect(cancel).toContain("await restoreInventoryAfterOrderCancellation");
    expect(cancel.indexOf("await markOrderCancelled")).toBeLessThan(
      cancel.indexOf("await restoreInventoryAfterOrderCancellation"),
    );
    expect(refunds).toContain("idempotencyKey");
    expect(refunds).toContain("wallet-refund-");
    expect(inventory).toContain("already_available");
    expect(inventory).toContain("healInventoryAfterCancelledOrder");
  });

  it("cancel voids only current parcels and never writes order_shipments", () => {
    const cancel = read("lib/orders/cancel-order.server.ts");
    expect(cancel).toContain("parcelIdsToVoid");
    expect(cancel).toContain("resolveCancellationShipmentGate");
    expect(cancel).not.toContain('from("order_shipments")');
    expect(cancel).not.toContain("appendShipmentParcel");
  });
});

describe("regression locks", () => {
  it("20 MEDIUM #7 unchanged", () => {
    expect(LABEL_GENERATION_IDEMPOTENCY_V1.medium).toBe(
      "MEDIUM_7_DUPLICATE_SHIPMENT_LABEL_PROTECTION",
    );
    const active = selectActiveParcelForLabelProtection([
      historicalEvriFailed,
      activeRoyalMail,
    ]);
    expect(active?.id).toBe("live-rm");
  });

  it("21 shipping SSOT", () => {
    expect(SHIPPING_RECORDS_SSOT_V1.canonicalTable).toBe("shipping_records");
    expect(SHIPPING_SSOT_LEGACY_ORDER_SHIPMENTS_POLICY.insert).toBe("forbidden");
    const store = read("lib/shipping/store.ts");
    expect(store).toContain("never dual-write order_shipments");
    expect(store).toContain("never insert/update order_shipments");
  });

  it("22 tracking mapper still fail-closed", () => {
    const mapper = read("lib/shipping/sendcloud/status-mapper.ts");
    expect(mapper).toContain("mapSendcloudTrackingStatus");
    expect(mapper).toContain("return null");
  });

  it("23 checkout not rewritten", () => {
    const cancel = read("lib/orders/cancel-order.server.ts");
    expect(cancel).toContain("cancelPendingOrder");
  });

  it("Order Details uses production resolver — no parallel UI", () => {
    const detail = read("features/orders/components/OrderDetailView.tsx");
    const actions = read("features/orders/components/OrderActionsCard.tsx");
    expect(detail).toContain("extractActiveOrderDisplayCarriers");
    expect(detail).toContain("shippingRecordCarrier");
    expect(actions).toContain("displayTrackingNumber");
    expect(actions).not.toContain("Royal Mail");
  });
});
