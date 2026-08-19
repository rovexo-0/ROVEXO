/**
 * SENDCLOUD-FUNCTIONAL-HARDENING-V1 — Phase 1 cancellation consistency.
 * Refund is authoritative; Sendcloud cancel runs only after confirmed refund success.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const cancelParcel = vi.fn();
const createOrderStripeRefund = vi.fn();
const markOrderCancellationRequested = vi.fn();
const updateShippingRecordStatus = vi.fn();
const getShippingRecord = vi.fn();
const listShipmentParcelsForOrder = vi.fn();
const releaseShippingReserveForOrder = vi.fn();
const releaseProductInventory = vi.fn();
const restoreInventoryAfterOrderCancellation = vi.fn();
const healInventoryAfterCancelledOrder = vi.fn();
const refundSeller = vi.fn();
const notifyOrderCancelled = vi.fn();
const notifySellerOrderCancelledByBuyer = vi.fn();

const orderRow = {
  id: "order-1",
  order_number: "RVX-1",
  status: "awaiting_shipment",
  buyer_id: "buyer-1",
  seller_id: "seller-1",
  total: 50,
  paid_at: "2026-08-01T10:00:00Z",
  stripe_payment_intent_id: "pi_test",
  stripe_refund_id: null as string | null,
  order_items: [{ product_id: "p1", title: "Item", quantity: 1 }],
};

const adminFrom = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: adminFrom }),
}));

vi.mock("@/lib/shipping/db-client", () => ({
  createShippingAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () =>
          Promise.resolve({
            data: [{ label_status: "pending", provider_parcel_id: "12345" }],
          }),
      }),
      update: () => ({
        eq: () => ({
          not: () => Promise.resolve({ data: null }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/shipping/sendcloud/service", () => ({
  SendcloudService: { cancelParcel },
}));

vi.mock("@/lib/stripe/refunds", () => ({
  createOrderStripeRefund,
  ZERO_CAPTURE_ERROR: "No captured payment to refund.",
  isZeroCaptureRefundError: (error: string | undefined) =>
    error === "No captured payment to refund.",
}));

vi.mock("@/lib/orders/refund-lifecycle.server", () => ({
  markOrderCancellationRequested,
}));

vi.mock("@/lib/shipping/store", () => ({
  getShippingRecord,
  updateShippingRecordStatus,
}));

vi.mock("@/lib/shipping/parcels-repository", () => ({
  listShipmentParcelsForOrder,
}));

vi.mock("@/lib/commerce-engine/shipping-reserve", () => ({
  releaseShippingReserveForOrder,
}));

vi.mock("@/lib/inventory/service", () => ({
  releaseProductInventory,
  restoreInventoryAfterOrderCancellation,
  healInventoryAfterCancelledOrder,
}));

vi.mock("@/lib/commerce-engine", () => ({
  CommerceEngine: { refundSeller },
}));

vi.mock("@/lib/orders/notifications", () => ({
  notifyOrderCancelled,
  notifySellerOrderCancelledByBuyer,
}));

vi.mock("@/lib/orders/checkout", () => ({
  cancelPendingOrder: vi.fn(),
}));

function mockOrderQuery(order: typeof orderRow | null) {
  adminFrom.mockImplementation((table: string) => {
    if (table === "orders") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: order }),
          }),
        }),
        update: () => ({
          eq: () => Promise.resolve({ data: null }),
        }),
      };
    }
    if (table === "profiles") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: { email: "t@example.com" } }),
          }),
        }),
      };
    }
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ data: null }),
      }),
    };
  });
}

describe("cancelBuyerOrder — refund before Sendcloud cancel", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    orderRow.stripe_refund_id = null;
    mockOrderQuery(orderRow);
    getShippingRecord.mockResolvedValue({
      id: "ship-1",
      status: "preparing",
    });
    listShipmentParcelsForOrder.mockResolvedValue([]);
    markOrderCancellationRequested.mockResolvedValue(undefined);
    releaseShippingReserveForOrder.mockResolvedValue(undefined);
    releaseProductInventory.mockResolvedValue(undefined);
    restoreInventoryAfterOrderCancellation.mockResolvedValue({
      restored: true,
      reason: "restored_claim",
    });
    healInventoryAfterCancelledOrder.mockResolvedValue({
      restored: false,
      reason: "already_available",
    });
    refundSeller.mockResolvedValue(undefined);
    notifyOrderCancelled.mockResolvedValue(undefined);
    notifySellerOrderCancelledByBuyer.mockResolvedValue(undefined);
    updateShippingRecordStatus.mockResolvedValue(undefined);
  });

  it("A: refund success + Sendcloud cancel success => PASS", async () => {
    createOrderStripeRefund.mockResolvedValue({ refundId: "re_1" });
    cancelParcel.mockResolvedValue(undefined);

    const { cancelBuyerOrder } = await import("@/lib/orders/cancel-order.server");
    const result = await cancelBuyerOrder({ orderId: "order-1", buyerId: "buyer-1" });

    expect(result.success).toBe(true);
    expect(createOrderStripeRefund.mock.invocationCallOrder[0]).toBeLessThan(
      cancelParcel.mock.invocationCallOrder[0]!,
    );
    expect(cancelParcel).toHaveBeenCalledWith(12345);
  });

  it("B: refund fails => Sendcloud cancellation NOT CALLED", async () => {
    createOrderStripeRefund.mockResolvedValue({ error: "Stripe refund failed" });

    const { cancelBuyerOrder } = await import("@/lib/orders/cancel-order.server");
    const result = await cancelBuyerOrder({ orderId: "order-1", buyerId: "buyer-1" });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/refund/i);
    expect(cancelParcel).not.toHaveBeenCalled();
  });

  it("B2: zero capture => cancel proceeds with £0 and no Wallet refund id", async () => {
    createOrderStripeRefund.mockResolvedValue({ error: "No captured payment to refund." });
    cancelParcel.mockResolvedValue(undefined);

    const { cancelBuyerOrder } = await import("@/lib/orders/cancel-order.server");
    const result = await cancelBuyerOrder({ orderId: "order-1", buyerId: "buyer-1" });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(cancelParcel).toHaveBeenCalled();
  });

  it("C: refund succeeds + Sendcloud cancel fails => refund kept; carrier not falsely cancelled", async () => {
    createOrderStripeRefund.mockResolvedValue({ refundId: "re_1" });
    cancelParcel.mockRejectedValue(new Error("Cancellation rejected by carrier"));

    const { cancelBuyerOrder } = await import("@/lib/orders/cancel-order.server");
    const result = await cancelBuyerOrder({ orderId: "order-1", buyerId: "buyer-1" });

    expect(result.success).toBe(true);
    expect(createOrderStripeRefund).toHaveBeenCalled();
    expect(cancelParcel).toHaveBeenCalled();
    expect(updateShippingRecordStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: "order-1",
        status: "failed",
      }),
    );
    const cancelledCalls = updateShippingRecordStatus.mock.calls.filter(
      (call) => call[0]?.status === "cancelled",
    );
    expect(cancelledCalls).toHaveLength(0);
  });

  it("D: cancellation retry => no duplicate refund (Stripe idempotency)", async () => {
    createOrderStripeRefund
      .mockResolvedValueOnce({ refundId: "re_1" })
      .mockResolvedValueOnce({ refundId: "re_1" });
    cancelParcel.mockResolvedValue(undefined);

    const { cancelBuyerOrder } = await import("@/lib/orders/cancel-order.server");
    await cancelBuyerOrder({ orderId: "order-1", buyerId: "buyer-1" });

    orderRow.status = "awaiting_shipment";
    mockOrderQuery(orderRow);
    await cancelBuyerOrder({ orderId: "order-1", buyerId: "buyer-1" });

    expect(createOrderStripeRefund).toHaveBeenCalledTimes(2);
    // createOrderStripeRefund itself uses idempotencyKey order-refund-${orderId}
    expect(createOrderStripeRefund).toHaveBeenCalledWith("order-1", { notifySeller: false });
  });

  it("E: already-refunded order => createOrderStripeRefund still called once path (returns existing)", async () => {
    orderRow.stripe_refund_id = "re_existing";
    mockOrderQuery(orderRow);
    createOrderStripeRefund.mockResolvedValue({ refundId: "re_existing" });
    cancelParcel.mockResolvedValue(undefined);

    const { cancelBuyerOrder } = await import("@/lib/orders/cancel-order.server");
    const result = await cancelBuyerOrder({ orderId: "order-1", buyerId: "buyer-1" });

    expect(result.success).toBe(true);
    expect(createOrderStripeRefund).toHaveBeenCalledTimes(1);
    expect(cancelParcel).toHaveBeenCalled();
  });

  it("F: already-cancelled parcel => idempotent Sendcloud cancel treated as success", async () => {
    createOrderStripeRefund.mockResolvedValue({ refundId: "re_1" });
    cancelParcel.mockRejectedValue(new Error("Parcel already cancelled"));

    const { cancelBuyerOrder } = await import("@/lib/orders/cancel-order.server");
    const result = await cancelBuyerOrder({ orderId: "order-1", buyerId: "buyer-1" });

    expect(result.success).toBe(true);
    expect(updateShippingRecordStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cancelled" }),
    );
  });

  it("orchestrates Stripe refund before Sendcloud cancel in source order", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("lib/orders/cancel-order.server.ts", "utf8");
    const refundIdx = src.indexOf("createOrderStripeRefund");
    const cancelIdx = src.indexOf("cancelSendcloudParcels(context.providerParcelIds)");
    expect(refundIdx).toBeGreaterThan(0);
    expect(cancelIdx).toBeGreaterThan(refundIdx);
  });
});
