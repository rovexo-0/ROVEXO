/**
 * HIGH #1 — Sendcloud tracking status mapper fail-closed.
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  isRecognizedSendcloudTrackingStatus,
  mapSendcloudTrackingStatus,
} from "@/lib/shipping/sendcloud/status-mapper";
import type { SendcloudWebhookPayload } from "@/lib/shipping/sendcloud/types";

function basePayload(overrides?: Partial<SendcloudWebhookPayload>): SendcloudWebhookPayload {
  return {
    action: "parcel_status_changed",
    timestamp: 1_720_000_000,
    parcel: {
      id: 998877,
      tracking_number: "SC123456789GB",
      status: { id: 11, message: "Delivered" },
    },
    ...overrides,
  };
}

describe("Sendcloud status mapper fail-closed", () => {
  it("known pending status → preparing", () => {
    expect(mapSendcloudTrackingStatus("Created")).toBe("preparing");
    expect(mapSendcloudTrackingStatus("Label Generated")).toBe("preparing");
    expect(mapSendcloudTrackingStatus("Awaiting pickup")).toBe("preparing");
    expect(mapSendcloudTrackingStatus("Preparing")).toBe("preparing");
  });

  it("known shipped/collected status → collected", () => {
    expect(mapSendcloudTrackingStatus("Collected")).toBe("collected");
    expect(mapSendcloudTrackingStatus("Picked up")).toBe("collected");
    expect(mapSendcloudTrackingStatus("Announced")).toBe("collected");
    expect(mapSendcloudTrackingStatus("Ready to send")).toBe("collected");
  });

  it("known in_transit → in_transit", () => {
    expect(mapSendcloudTrackingStatus("In Transit")).toBe("in_transit");
    expect(mapSendcloudTrackingStatus("On the way")).toBe("in_transit");
    expect(mapSendcloudTrackingStatus("En route to sorting centre")).toBe("in_transit");
  });

  it("known delivered → delivered", () => {
    expect(mapSendcloudTrackingStatus("Delivered")).toBe("delivered");
    expect(mapSendcloudTrackingStatus("Parcel delivered")).toBe("delivered");
  });

  it("unknown string → NO lifecycle mapping", () => {
    expect(mapSendcloudTrackingStatus("weird carrier blob xyz")).toBeNull();
    expect(mapSendcloudTrackingStatus("STATUS_CODE_999")).toBeNull();
    expect(isRecognizedSendcloudTrackingStatus("weird carrier blob xyz")).toBe(false);
  });

  it("empty/null/unexpected payload → NO lifecycle mapping", () => {
    expect(mapSendcloudTrackingStatus(undefined)).toBeNull();
    expect(mapSendcloudTrackingStatus(null)).toBeNull();
    expect(mapSendcloudTrackingStatus("")).toBeNull();
    expect(mapSendcloudTrackingStatus("   ")).toBeNull();
  });

  it("mapper never falls back to shipped / in_transit / delivered for unknown", () => {
    const src = readFileSync("lib/shipping/sendcloud/status-mapper.ts", "utf8");
    expect(src).toContain("return null");
    expect(src).toContain("never invent shipped / in_transit / delivered");
    // Final fallback must be null — not a default lifecycle status.
    expect(src.trimEnd().endsWith("}")).toBe(true);
    expect(src).toMatch(/\/\/ Unknown[\s\S]*return null;\s*\n\}/);
    expect(mapSendcloudTrackingStatus("completely unknown")).toBeNull();
    expect(mapSendcloudTrackingStatus("completely unknown")).not.toBe("in_transit");
    expect(mapSendcloudTrackingStatus("completely unknown")).not.toBe("delivered");
    expect(mapSendcloudTrackingStatus("completely unknown")).not.toBe("collected");
  });
});

describe("Sendcloud webhook — unknown status preserves lifecycle", () => {
  afterEach(() => {
    vi.doUnmock("@/lib/supabase/admin");
    vi.doUnmock("@/lib/shipping/store");
    vi.doUnmock("@/lib/commerce-engine/shipping-hooks.server");
    vi.doUnmock("@/lib/shipping/env");
    vi.resetModules();
  });

  it("previous valid status + unknown next event → previous preserved; event recorded", async () => {
    const sideEffects: string[] = [];
    let preservedStatus = "collected";

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: (table: string) => {
          if (table !== "sendcloud_webhook_events") {
            throw new Error(`unexpected table ${table}`);
          }
          return {
            insert: async () => ({ data: [{ webhook_event_id: "1" }], error: null }),
            update: () => ({
              eq: async () => ({ data: null, error: null }),
            }),
            delete: () => ({
              eq: async () => ({ data: null, error: null }),
            }),
          };
        },
      }),
    }));
    vi.doMock("@/lib/shipping/store", () => ({
      findShippingRecordByTrackingNumber: async () => ({
        orderId: "order-preserve-1",
        id: "ship-1",
        status: preservedStatus,
      }),
      updateShippingRecordStatus: async () => {
        sideEffects.push("updateShippingRecordStatus");
        preservedStatus = "in_transit";
        return { orderId: "order-preserve-1", status: preservedStatus };
      },
      recordShippingTrackingDiagnosticEvent: async (input: {
        orderId: string;
        description?: string;
      }) => {
        sideEffects.push("recordShippingTrackingDiagnosticEvent");
        expect(input.orderId).toBe("order-preserve-1");
        expect(input.description).toContain("UNKNOWN_BLOB");
        return { orderId: "order-preserve-1", status: preservedStatus };
      },
    }));
    vi.doMock("@/lib/shipping/parcels-repository", () => ({
      listShipmentParcelsForOrder: async () => [],
      findOrderIdByParcelTrackingNumber: async () => null,
    }));
    vi.doMock("@/lib/commerce-engine/shipping-hooks.server", () => ({
      onShippingRecordStatusChanged: async () => {
        sideEffects.push("onShippingRecordStatusChanged");
      },
    }));
    vi.doMock("@/lib/shipping/env", () => ({
      isSendcloudConfigured: () => true,
      getSendcloudWebhookSecret: () => "secret",
    }));

    const { handleSendcloudWebhookEvent } = await import("@/lib/shipping/sendcloud/webhooks");
    const result = await handleSendcloudWebhookEvent(
      basePayload({
        timestamp: 1_720_000_111,
        parcel: {
          id: 42,
          tracking_number: "SC123456789GB",
          status: { id: 99, message: "UNKNOWN_BLOB_XYZ" },
        },
      }),
    );

    expect(result.handled).toBe(true);
    expect(result.message).toMatch(/without lifecycle advancement/);
    expect(sideEffects).toEqual(["recordShippingTrackingDiagnosticEvent"]);
    expect(sideEffects).not.toContain("updateShippingRecordStatus");
    expect(sideEffects).not.toContain("onShippingRecordStatusChanged");
    expect(preservedStatus).toBe("collected");
  });

  it("unknown webhook event still idempotently recorded (claim + complete)", async () => {
    const completed: string[] = [];
    const sideEffects: string[] = [];

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: (table: string) => {
          if (table !== "sendcloud_webhook_events") {
            throw new Error(`unexpected table ${table}`);
          }
          return {
            insert: async (row: { webhook_event_id: string }) => ({
              data: [{ webhook_event_id: row.webhook_event_id }],
              error: null,
            }),
            update: () => ({
              eq: async (_col: string, webhookEventId: string) => {
                completed.push(webhookEventId);
                return { data: null, error: null };
              },
            }),
            delete: () => ({
              eq: async () => ({ data: null, error: null }),
            }),
          };
        },
      }),
    }));
    vi.doMock("@/lib/shipping/store", () => ({
      findShippingRecordByTrackingNumber: async () => ({
        orderId: "order-diag-1",
        id: "ship-diag-1",
        status: "preparing",
      }),
      updateShippingRecordStatus: async () => {
        sideEffects.push("updateShippingRecordStatus");
      },
      recordShippingTrackingDiagnosticEvent: async () => {
        sideEffects.push("recordShippingTrackingDiagnosticEvent");
        return { orderId: "order-diag-1", status: "preparing" };
      },
    }));
    vi.doMock("@/lib/shipping/parcels-repository", () => ({
      listShipmentParcelsForOrder: async () => [],
      findOrderIdByParcelTrackingNumber: async () => null,
    }));
    vi.doMock("@/lib/commerce-engine/shipping-hooks.server", () => ({
      onShippingRecordStatusChanged: async () => {
        sideEffects.push("onShippingRecordStatusChanged");
      },
    }));
    vi.doMock("@/lib/shipping/env", () => ({
      isSendcloudConfigured: () => true,
      getSendcloudWebhookSecret: () => "secret",
    }));

    const { handleSendcloudWebhookEvent } = await import("@/lib/shipping/sendcloud/webhooks");
    const payload = basePayload({
      timestamp: 1_720_000_222,
      parcel: {
        id: 77,
        tracking_number: "SC999",
        status: { id: 7, message: "" },
      },
    });
    const first = await handleSendcloudWebhookEvent(payload);
    expect(first.handled).toBe(true);
    expect(sideEffects).toEqual(["recordShippingTrackingDiagnosticEvent"]);
    expect(completed).toEqual(["77:7:1720000222"]);

    // Duplicate claim path — second delivery ignored without re-running diagnostics.
    // Re-import after re-mocking insert to simulate unique conflict.
    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: () => ({
          insert: async () => ({
            data: null,
            error: { code: "23505", message: "duplicate" },
          }),
          update: () => ({ eq: async () => ({ data: null, error: null }) }),
          delete: () => ({ eq: async () => ({ data: null, error: null }) }),
        }),
      }),
    }));
    vi.doMock("@/lib/shipping/store", () => ({
      findShippingRecordByTrackingNumber: async () => ({
        orderId: "order-diag-1",
        id: "ship-diag-1",
      }),
      updateShippingRecordStatus: async () => {
        sideEffects.push("updateShippingRecordStatus");
      },
      recordShippingTrackingDiagnosticEvent: async () => {
        sideEffects.push("recordShippingTrackingDiagnosticEvent");
      },
      getShippingRecord: async () => ({ orderId: "order-diag-1", id: "ship-diag-1" }),
    }));
    vi.doMock("@/lib/shipping/parcels-repository", () => ({
      listShipmentParcelsForOrder: async () => [],
      findOrderIdByParcelTrackingNumber: async () => null,
    }));
    vi.doMock("@/lib/commerce-engine/shipping-hooks.server", () => ({
      onShippingRecordStatusChanged: async () => {
        sideEffects.push("onShippingRecordStatusChanged");
      },
    }));
    vi.doMock("@/lib/shipping/env", () => ({
      isSendcloudConfigured: () => true,
      getSendcloudWebhookSecret: () => "secret",
    }));

    const { handleSendcloudWebhookEvent: handleAgain } = await import(
      "@/lib/shipping/sendcloud/webhooks"
    );
    const second = await handleAgain(payload);
    expect(second.duplicate).toBe(true);
    expect(sideEffects).toEqual(["recordShippingTrackingDiagnosticEvent"]);
  });

  it("webhook + cron consumers refuse unknown lifecycle advancement", () => {
    const webhook = readFileSync(join(process.cwd(), "lib/shipping/sendcloud/webhooks.ts"), "utf8");
    expect(webhook).toContain("recordShippingTrackingDiagnosticEvent");
    expect(webhook).toContain("without lifecycle advancement");
    expect(webhook).toContain("mapSendcloudTrackingStatus");

    const cron = readFileSync(
      join(process.cwd(), "lib/shipping/sendcloud-tracking-sync.server.ts"),
      "utf8",
    );
    expect(cron).toContain("tracking.status != null");
    expect(cron).toContain("do not invent in_transit");

    const route = readFileSync(
      join(process.cwd(), "app/api/shipping/sendcloud/tracking/route.ts"),
      "utf8",
    );
    expect(route).toContain("tracking.status != null");

    const store = readFileSync(join(process.cwd(), "lib/shipping/store.ts"), "utf8");
    expect(store).toContain("recordShippingTrackingDiagnosticEvent");
    expect(store).toContain("without advancing");
  });
});
