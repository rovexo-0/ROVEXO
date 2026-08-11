import { beforeEach, describe, expect, it, vi } from "vitest";

const { getShippingRecord, findShippingRecordByTrackingNumber, fromMaybeSingle } = vi.hoisted(
  () => {
    const fromMaybeSingle = vi.fn();
    return {
      getShippingRecord: vi.fn(),
      findShippingRecordByTrackingNumber: vi.fn(),
      fromMaybeSingle,
    };
  },
);

vi.mock("@/lib/shipping/store", () => ({
  getShippingRecord,
  findShippingRecordByTrackingNumber,
  updateShippingRecordStatus: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: (_col: string, value: string) => ({
          maybeSingle: async () => fromMaybeSingle(table, value),
        }),
      }),
    }),
  }),
}));

import { assertSendcloudTrackingRefreshAccess } from "@/lib/shipping/assert-order-shipping-access.server";

const ORDER_A = "11111111-1111-4111-8111-111111111111";
const ORDER_B = "22222222-2222-4222-8222-222222222222";
const BUYER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const SELLER_A = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER_B = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function shippingRecord(overrides: {
  orderId: string;
  trackingNumber: string | null;
}) {
  return {
    id: "rec-1",
    orderId: overrides.orderId,
    parcelTier: "small_parcel",
    status: "in_transit",
    carrier: "royal_mail",
    trackingNumber: overrides.trackingNumber,
    collectionAddress: null,
    deliveryAddress: null,
    pricing: null,
    label: overrides.trackingNumber
      ? {
          trackingNumber: overrides.trackingNumber,
          barcode: null,
          qrPayload: null,
          pdfUrl: null,
          carrier: "royal_mail",
          status: "ready",
        }
      : null,
    parcels: [],
    trackingEvents: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("assertSendcloudTrackingRefreshAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMaybeSingle.mockImplementation(async (table: string, value: string) => {
      if (table === "orders" && value === ORDER_A) {
        return {
          data: {
            id: ORDER_A,
            buyer_id: BUYER_A,
            seller_id: SELLER_A,
            status: "shipped",
            tracking_number: "SC-A-001",
          },
        };
      }
      if (table === "orders" && value === ORDER_B) {
        return {
          data: {
            id: ORDER_B,
            buyer_id: USER_B,
            seller_id: USER_B,
            status: "shipped",
            tracking_number: "SC-B-001",
          },
        };
      }
      return { data: null };
    });
  });

  it("TEST A — User A cannot refresh User B trackingNumber", async () => {
    findShippingRecordByTrackingNumber.mockResolvedValue(
      shippingRecord({ orderId: ORDER_B, trackingNumber: "SC-B-001" }),
    );

    const result = await assertSendcloudTrackingRefreshAccess({
      userId: BUYER_A,
      trackingNumber: "SC-B-001",
    });

    expect(result).toEqual({ ok: false });
  });

  it("TEST B — User A orderId + User B trackingNumber rejected", async () => {
    getShippingRecord.mockResolvedValue(
      shippingRecord({ orderId: ORDER_A, trackingNumber: "SC-A-001" }),
    );

    const result = await assertSendcloudTrackingRefreshAccess({
      userId: BUYER_A,
      orderId: ORDER_A,
      trackingNumber: "SC-B-001",
    });

    expect(result).toEqual({ ok: false });
    expect(findShippingRecordByTrackingNumber).not.toHaveBeenCalled();
  });

  it("TEST C — User A cannot use User B orderId + User B tracking", async () => {
    getShippingRecord.mockResolvedValue(
      shippingRecord({ orderId: ORDER_B, trackingNumber: "SC-B-001" }),
    );

    const result = await assertSendcloudTrackingRefreshAccess({
      userId: BUYER_A,
      orderId: ORDER_B,
      trackingNumber: "SC-B-001",
    });

    expect(result).toEqual({ ok: false });
  });

  it("TEST E — random/nonexistent tracking fails closed without inventing order", async () => {
    findShippingRecordByTrackingNumber.mockResolvedValue(null);

    const result = await assertSendcloudTrackingRefreshAccess({
      userId: BUYER_A,
      trackingNumber: "DOES-NOT-EXIST",
    });

    expect(result).toEqual({ ok: false });
  });

  it("TEST F — authorized buyer PASS", async () => {
    getShippingRecord.mockResolvedValue(
      shippingRecord({ orderId: ORDER_A, trackingNumber: "SC-A-001" }),
    );

    const result = await assertSendcloudTrackingRefreshAccess({
      userId: BUYER_A,
      orderId: ORDER_A,
      trackingNumber: "SC-A-001",
    });

    expect(result).toEqual({
      ok: true,
      role: "buyer",
      orderId: ORDER_A,
      trackingNumber: "SC-A-001",
    });
  });

  it("TEST G — authorized seller PASS", async () => {
    getShippingRecord.mockResolvedValue(
      shippingRecord({ orderId: ORDER_A, trackingNumber: "SC-A-001" }),
    );

    const result = await assertSendcloudTrackingRefreshAccess({
      userId: SELLER_A,
      orderId: ORDER_A,
      trackingNumber: "sc-a-001",
    });

    expect(result).toEqual({
      ok: true,
      role: "seller",
      orderId: ORDER_A,
      trackingNumber: "SC-A-001",
    });
  });

  it("tracking-only path resolves order then participant-gates", async () => {
    findShippingRecordByTrackingNumber.mockResolvedValue(
      shippingRecord({ orderId: ORDER_A, trackingNumber: "SC-A-001" }),
    );

    const result = await assertSendcloudTrackingRefreshAccess({
      userId: BUYER_A,
      trackingNumber: "SC-A-001",
    });

    expect(result).toEqual({
      ok: true,
      role: "buyer",
      orderId: ORDER_A,
      trackingNumber: "SC-A-001",
    });
  });
});
