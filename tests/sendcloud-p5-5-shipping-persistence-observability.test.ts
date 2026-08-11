/**
 * P5.5 — Structured shipping persistence failure observability.
 * Mocks only. No live DB / Sendcloud / production orders.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SHIPPING_PERSISTENCE_FAILURE_EVENT,
  buildShippingPersistenceFailureLog,
  extractSafeDbErrorFields,
  logShippingPersistenceFailure,
} from "@/lib/shipping/shipping-persistence-failure-log-v1";

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

describe("P5.5 shipping persistence failure log helper", () => {
  it("preserves original DB error code/message/details/constraint", () => {
    const fields = extractSafeDbErrorFields({
      code: "42501",
      message: "permission denied for table shipping_records",
      details: "Failing row contains (order_id).",
      hint: null,
      constraint: "shipping_records_order_id_fkey",
    });
    expect(fields).toEqual({
      errorCode: "42501",
      errorMessage: "permission denied for table shipping_records",
      errorDetails: "Failing row contains (order_id).",
      errorConstraint: "shipping_records_order_id_fkey",
    });
  });

  it("redacts secret-looking strings from error message", () => {
    const fields = extractSafeDbErrorFields({
      code: "PGRST301",
      message: "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb",
    });
    expect(fields.errorMessage).toBe("[redacted]");
  });

  it("builds the required structured event shape", () => {
    const payload = buildShippingPersistenceFailureLog({
      failureStage: "shipping_records.insert",
      orderId: "7554fb35-6261-4b4b-96a5-aef0273d9b5b",
      orderNumber: "RVX8343A7C7",
      selectedShippingQuoteId: "sendcloud:27227",
      shippingRecordOperation: "insert",
      error: {
        code: "42501",
        message: "permission denied for table shipping_records",
      },
      timestamp: "2026-08-11T21:00:00.000Z",
    });
    expect(payload.event).toBe(SHIPPING_PERSISTENCE_FAILURE_EVENT);
    expect(payload.failureStage).toBe("shipping_records.insert");
    expect(payload.orderId).toBe("7554fb35-6261-4b4b-96a5-aef0273d9b5b");
    expect(payload.orderNumber).toBe("RVX8343A7C7");
    expect(payload.selectedShippingQuoteId).toBe("sendcloud:27227");
    expect(payload.errorCode).toBe("42501");
    expect(payload.errorMessage).toContain("permission denied");
    expect(payload.timestamp).toBe("2026-08-11T21:00:00.000Z");
    expect(JSON.stringify(payload)).not.toMatch(/sk_live_|whsec_|service_role|Bearer /i);
  });

  it("emits console structured event without DB mutation", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const payload = logShippingPersistenceFailure({
      failureStage: "shipping_records.insert",
      orderId: "ord-1",
      orderNumber: "RVXTEST",
      selectedShippingQuoteId: "sendcloud:27227",
      shippingRecordOperation: "insert",
      error: { code: "23503", message: "fk violation" },
    });
    expect(payload.event).toBe("shipping_persistence_failure");
    expect(spy).toHaveBeenCalledWith(
      `[${SHIPPING_PERSISTENCE_FAILURE_EVENT}]`,
      expect.objectContaining({
        event: "shipping_persistence_failure",
        orderId: "ord-1",
        orderNumber: "RVXTEST",
        selectedShippingQuoteId: "sendcloud:27227",
        failureStage: "shipping_records.insert",
        errorCode: "23503",
        errorMessage: "fk violation",
      }),
    );
    spy.mockRestore();
  });
});

describe("P5.5 ensureShippingRecord INSERT observability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    maybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it("emits structured failure event with orderId/orderNumber/selected quote + original DB error", async () => {
    insertSingle.mockResolvedValue({
      data: null,
      error: {
        code: "42501",
        message: "permission denied for table shipping_records",
        details: "RLS policy",
      },
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { ensureShippingRecord } = await import("@/lib/shipping/store");
    await expect(
      ensureShippingRecord({
        orderId: "ord-p55",
        orderNumber: "RVXP55",
        selectedQuoteId: "sendcloud:27227",
        carrier: "InPost",
      }),
    ).rejects.toThrow(/Failed to insert shipping_records for order ord-p55: permission denied/);

    const structuredCalls = spy.mock.calls.filter(
      (args) => args[0] === `[${SHIPPING_PERSISTENCE_FAILURE_EVENT}]`,
    );
    expect(structuredCalls.length).toBeGreaterThanOrEqual(1);
    const payload = structuredCalls[0]?.[1] as Record<string, unknown>;
    expect(payload.event).toBe("shipping_persistence_failure");
    expect(payload.orderId).toBe("ord-p55");
    expect(payload.orderNumber).toBe("RVXP55");
    expect(payload.selectedShippingQuoteId).toBe("sendcloud:27227");
    expect(payload.failureStage).toBe("shipping_records.insert");
    expect(payload.shippingRecordOperation).toBe("insert");
    expect(payload.errorCode).toBe("42501");
    expect(String(payload.errorMessage)).toContain("permission denied");
    expect(JSON.stringify(payload)).not.toMatch(/sk_live_|whsec_|service_role|apikey/i);

    spy.mockRestore();
  });

  it("does not emit false failure event on successful insert", async () => {
    insertSingle.mockResolvedValue({
      data: {
        id: "sr-ok",
        order_id: "ord-ok",
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
    maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({
        data: {
          id: "sr-ok",
          order_id: "ord-ok",
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

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { ensureShippingRecord } = await import("@/lib/shipping/store");
    const record = await ensureShippingRecord({
      orderId: "ord-ok",
      orderNumber: "RVXOK",
      selectedQuoteId: "sendcloud:27227",
    });
    expect(record?.id).toBe("sr-ok");
    const structuredCalls = spy.mock.calls.filter(
      (args) => args[0] === `[${SHIPPING_PERSISTENCE_FAILURE_EVENT}]`,
    );
    expect(structuredCalls).toHaveLength(0);
    spy.mockRestore();
  });
});
