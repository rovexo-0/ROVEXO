/**
 * P4 — ensureShippingRecord INSERT fail-loud (no silent null).
 * Mocks only the shipping admin client. No live DB / Sendcloud / orders.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const insertSingle = vi.fn();
const maybeSingle = vi.fn();

vi.mock("@/lib/shipping/db-client", () => ({
  createShippingAdminClient: () => ({
    from: (table: string) => {
      if (table === "shipping_records") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => maybeSingle(),
            }),
          }),
          insert: () => ({
            select: () => ({
              single: () => insertSingle(),
            }),
          }),
          update: () => ({
            eq: async () => ({ error: null }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
              ascending: undefined,
            }),
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
        insert: async () => ({ error: null }),
      };
    },
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  }),
}));

vi.mock("@/lib/shipping/parcels-repository", () => ({
  listShipmentParcelsForOrder: async () => [],
  createShipmentParcel: async () => null,
  attachLabelToParcel: async () => null,
}));

describe("P4 ensureShippingRecord INSERT fail-loud", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it("throws a precise error on shipping_records INSERT failure (never silent null)", async () => {
    insertSingle.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "permission denied for table shipping_records" },
    });

    const { ensureShippingRecord } = await import("@/lib/shipping/store");
    await expect(
      ensureShippingRecord({
        orderId: "ord-simulated",
        orderNumber: "RVXSIM",
        selectedQuoteId: "sendcloud:27227",
        carrier: "InPost",
      }),
    ).rejects.toThrow(
      /Failed to insert shipping_records for order ord-simulated: permission denied/,
    );
  });

  it("does not require quote_payload or shippingOptionCode on INSERT", async () => {
    insertSingle.mockResolvedValue({
      data: {
        id: "sr-sim",
        order_id: "ord-simulated",
        parcel_tier: "small_parcel",
        status: "preparing",
        carrier: "InPost",
        tracking_number: null,
        collection_address: null,
        delivery_address: null,
        selected_quote_id: "sendcloud:27227",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    });
    // After insert, getShippingRecord re-reads
    maybeSingle
      .mockResolvedValueOnce({ data: null, error: null }) // existing check
      .mockResolvedValueOnce({
        data: {
          id: "sr-sim",
          order_id: "ord-simulated",
          parcel_tier: "small_parcel",
          status: "preparing",
          carrier: "InPost",
          tracking_number: null,
          collection_address: null,
          delivery_address: null,
          selected_quote_id: "sendcloud:27227",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

    const { ensureShippingRecord } = await import("@/lib/shipping/store");
    const record = await ensureShippingRecord({
      orderId: "ord-simulated",
      selectedQuoteId: "sendcloud:27227",
      carrier: "InPost",
      manualTier: "small_parcel",
    });
    expect(record?.id).toBe("sr-sim");
    expect(insertSingle).toHaveBeenCalled();
  });
});
