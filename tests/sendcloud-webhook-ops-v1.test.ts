import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

import { verifySendcloudWebhookRequest } from "@/lib/shipping/sendcloud/webhooks";
import {
  SENDCLOUD_WEBHOOK_IDEMPOTENCY_V1,
  extractSendcloudWebhookEventId,
} from "@/lib/shipping/sendcloud/webhook-idempotency-v1";
import type { SendcloudWebhookPayload } from "@/lib/shipping/sendcloud/types";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

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

describe("Sendcloud webhook ops fail-closed", () => {
  const originalSecret = process.env.SENDCLOUD_WEBHOOK_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SENDCLOUD_WEBHOOK_SECRET;
    else process.env.SENDCLOUD_WEBHOOK_SECRET = originalSecret;
  });

  it("rejects when SENDCLOUD_WEBHOOK_SECRET is missing", () => {
    delete process.env.SENDCLOUD_WEBHOOK_SECRET;
    const request = new Request("http://localhost/api/webhooks/sendcloud", {
      method: "POST",
      headers: { "sendcloud-signature": "anything" },
    });
    expect(verifySendcloudWebhookRequest(request, "{}")).toBe(false);
  });

  it("rejects when signature header is missing", () => {
    process.env.SENDCLOUD_WEBHOOK_SECRET = "ops_test_secret_not_real";
    const request = new Request("http://localhost/api/webhooks/sendcloud", {
      method: "POST",
    });
    expect(verifySendcloudWebhookRequest(request, "{\"parcel\":{}}")).toBe(false);
  });

  it("rejects invalid signatures", () => {
    process.env.SENDCLOUD_WEBHOOK_SECRET = "ops_test_secret_not_real";
    const body = "{\"parcel\":{\"tracking_number\":\"TEST\"}}";
    const request = new Request("http://localhost/api/webhooks/sendcloud", {
      method: "POST",
      headers: { "sendcloud-signature": "deadbeef" },
    });
    expect(verifySendcloudWebhookRequest(request, body)).toBe(false);
  });

  it("accepts valid HMAC-SHA256 signatures", () => {
    const secret = "ops_test_secret_not_real";
    process.env.SENDCLOUD_WEBHOOK_SECRET = secret;
    const body = "{\"parcel\":{\"tracking_number\":\"TEST\"}}";
    const digest = createHmac("sha256", secret).update(body).digest("hex");
    const request = new Request("http://localhost/api/webhooks/sendcloud", {
      method: "POST",
      headers: { "sendcloud-signature": digest },
    });
    expect(verifySendcloudWebhookRequest(request, body)).toBe(true);
  });
});

describe("Sendcloud webhook idempotency v1.0 — identity", () => {
  it("uses official composite parcel.id:status.id:timestamp (no invented UUID)", () => {
    expect(SENDCLOUD_WEBHOOK_IDEMPOTENCY_V1.identityFormula).toBe(
      "{parcel.id}:{status.id}:{timestamp}",
    );
    const claim = extractSendcloudWebhookEventId(basePayload());
    expect(claim.webhookEventId).toBe("998877:11:1720000000");
    expect(claim.parcelId).toBe(998877);
    expect(claim.statusId).toBe(11);
    expect(claim.timestamp).toBe(1_720_000_000);
  });

  it("rejects missing official event identity with precise field reasons", () => {
    expect(() =>
      extractSendcloudWebhookEventId({
        timestamp: 1,
        parcel: { id: 1, status: { id: undefined as unknown as number, message: "x" } },
      }),
    ).toThrow(/Missing parcel\.status\.id/);

    expect(() =>
      extractSendcloudWebhookEventId({
        parcel: { id: 1, status: { id: 2, message: "x" } },
      }),
    ).toThrow(/Missing timestamp/);

    expect(() =>
      extractSendcloudWebhookEventId({
        timestamp: 9,
        parcel: { id: undefined as unknown as number, status: { id: 2, message: "x" } },
      }),
    ).toThrow(/Missing parcel\.id/);

    expect(() =>
      extractSendcloudWebhookEventId({
        timestamp: "2026-07-31T12:00:00Z",
        parcel: { id: 1, status: { id: 2, message: "x" } },
      }),
    ).toThrow(/unix epoch milliseconds/);
  });

  it("accepts numeric-string timestamp (official ms epoch)", () => {
    const claim = extractSendcloudWebhookEventId(
      basePayload({ timestamp: "1720000000000" }),
    );
    expect(claim.timestamp).toBe(1_720_000_000_000);
    expect(claim.webhookEventId).toBe("998877:11:1720000000000");
  });

  it("documents official Test API Webhook action test_webhook", () => {
    expect(SENDCLOUD_WEBHOOK_IDEMPOTENCY_V1.testAction).toBe("test_webhook");
  });

  it("different status or timestamp yields different event ids", () => {
    const a = extractSendcloudWebhookEventId(basePayload());
    const b = extractSendcloudWebhookEventId(
      basePayload({
        timestamp: 1_720_000_001,
        parcel: {
          id: 998877,
          tracking_number: "SC123456789GB",
          status: { id: 3, message: "In transit" },
        },
      }),
    );
    expect(a.webhookEventId).not.toBe(b.webhookEventId);
  });
});

describe("Sendcloud webhook idempotency v1.0 — atomic claim + side-effect gate", () => {
  it("ships migration with UNIQUE webhook_event_id and required columns", () => {
    const migration = join(
      process.cwd(),
      "supabase/migrations/20260731140000_sendcloud_webhook_idempotency_v1.sql",
    );
    expect(existsSync(migration)).toBe(true);
    const sql = readFileSync(migration, "utf8");
    expect(sql).toContain("create table if not exists public.sendcloud_webhook_events");
    expect(sql).toContain("webhook_event_id text primary key");
    expect(sql).toContain("tracking_number");
    expect(sql).toContain("order_id");
    expect(sql).toContain("event_type");
    expect(sql).toContain("processed_at");
    expect(sql).toContain("payload_hash");
    expect(sql).toContain("source");
    expect(sql).toContain("metadata");
  });

  it("first delivery claims and runs side effects; duplicate skips side effects", async () => {
    const inserts: string[] = [];
    const sideEffects: string[] = [];

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: (table: string) => {
          if (table !== "sendcloud_webhook_events") {
            throw new Error(`unexpected table ${table}`);
          }
          return {
            insert: async (row: { webhook_event_id: string }) => {
              if (inserts.includes(row.webhook_event_id)) {
                return { data: null, error: { code: "23505", message: "duplicate" } };
              }
              inserts.push(row.webhook_event_id);
              return { data: [{ webhook_event_id: row.webhook_event_id }], error: null };
            },
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
        orderId: "order-1",
        id: "ship-1",
      }),
      updateShippingRecordStatus: async () => {
        sideEffects.push("updateShippingRecordStatus");
        return { orderId: "order-1" };
      },
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
    const payload = basePayload();

    const first = await handleSendcloudWebhookEvent(payload);
    expect(first.handled).toBe(true);
    expect(first.duplicate).toBeUndefined();
    expect(sideEffects).toEqual([
      "updateShippingRecordStatus",
      "onShippingRecordStatusChanged",
    ]);

    const second = await handleSendcloudWebhookEvent(payload);
    expect(second.duplicate).toBe(true);
    expect(second.handled).toBe(true);
    expect(sideEffects).toEqual([
      "updateShippingRecordStatus",
      "onShippingRecordStatusChanged",
    ]);

    vi.doUnmock("@/lib/supabase/admin");
    vi.doUnmock("@/lib/shipping/store");
    vi.doUnmock("@/lib/commerce-engine/shipping-hooks.server");
    vi.doUnmock("@/lib/shipping/env");
    vi.resetModules();
  });

  it("Retry After Failed Processing — claim released then same webhook succeeds once", async () => {
    const claims = new Set<string>();
    const completed: string[] = [];
    const sideEffects: string[] = [];
    let updateAttempts = 0;

    vi.resetModules();
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: (table: string) => {
          if (table !== "sendcloud_webhook_events") {
            throw new Error(`unexpected table ${table}`);
          }
          return {
            insert: async (row: { webhook_event_id: string }) => {
              if (claims.has(row.webhook_event_id)) {
                return { data: null, error: { code: "23505", message: "duplicate" } };
              }
              claims.add(row.webhook_event_id);
              return { data: [{ webhook_event_id: row.webhook_event_id }], error: null };
            },
            update: () => ({
              eq: async (_col: string, webhookEventId: string) => {
                completed.push(webhookEventId);
                return { data: null, error: null };
              },
            }),
            delete: () => ({
              eq: async (_col: string, webhookEventId: string) => {
                claims.delete(webhookEventId);
                return { data: null, error: null };
              },
            }),
          };
        },
      }),
    }));
    vi.doMock("@/lib/shipping/store", () => ({
      findShippingRecordByTrackingNumber: async () => ({
        orderId: "order-retry-1",
        id: "ship-retry-1",
      }),
      updateShippingRecordStatus: async () => {
        updateAttempts += 1;
        if (updateAttempts === 1) {
          throw new Error("forced shipping status failure");
        }
        sideEffects.push("updateShippingRecordStatus");
        return { orderId: "order-retry-1" };
      },
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
    const { extractSendcloudWebhookEventId } = await import(
      "@/lib/shipping/sendcloud/webhook-idempotency-v1"
    );
    const payload = basePayload();
    const eventId = extractSendcloudWebhookEventId(payload).webhookEventId;

    await expect(handleSendcloudWebhookEvent(payload)).rejects.toThrow(
      /forced shipping status failure/,
    );
    expect(claims.has(eventId)).toBe(false);
    expect(sideEffects).toEqual([]);
    expect(completed).toEqual([]);
    expect(updateAttempts).toBe(1);

    const second = await handleSendcloudWebhookEvent(payload);
    expect(second.handled).toBe(true);
    expect(second.duplicate).toBeUndefined();
    expect(sideEffects).toEqual([
      "updateShippingRecordStatus",
      "onShippingRecordStatusChanged",
    ]);
    expect(updateAttempts).toBe(2);
    expect(completed).toEqual([eventId]);
    expect(claims.has(eventId)).toBe(true);
    expect(completed).toHaveLength(1);

    vi.doUnmock("@/lib/supabase/admin");
    vi.doUnmock("@/lib/shipping/store");
    vi.doUnmock("@/lib/commerce-engine/shipping-hooks.server");
    vi.doUnmock("@/lib/shipping/env");
    vi.resetModules();
  });

  it("concurrent identical claims — only one insert succeeds (23505)", async () => {
    vi.resetModules();
    let claimed = false;
    vi.doMock("@/lib/supabase/admin", () => ({
      createAdminClient: () => ({
        from: () => ({
          insert: async () => {
            if (claimed) {
              return { data: null, error: { code: "23505", message: "duplicate key" } };
            }
            claimed = true;
            return { data: [{ webhook_event_id: "x" }], error: null };
          },
        }),
      }),
    }));

    const { claimSendcloudWebhookEvent, extractSendcloudWebhookEventId } = await import(
      "@/lib/shipping/sendcloud/webhook-idempotency-v1"
    );
    const identity = extractSendcloudWebhookEventId(basePayload());
    const [a, b] = await Promise.all([
      claimSendcloudWebhookEvent(identity),
      claimSendcloudWebhookEvent(identity),
    ]);
    const outcomes = [a.outcome, b.outcome].sort();
    expect(outcomes).toEqual(["claimed", "duplicate"]);

    vi.doUnmock("@/lib/supabase/admin");
    vi.resetModules();
  });

  it("route returns structured errors and acknowledges official test_webhook", async () => {
    const routeSource = readFileSync(
      join(process.cwd(), "app/api/webhooks/sendcloud/route.ts"),
      "utf8",
    );
    expect(routeSource).toContain("success: false");
    expect(routeSource).toContain("Missing Sendcloud-Signature header");
    expect(routeSource).toContain("Signature mismatch");
    expect(routeSource).toContain("test_webhook");
    expect(routeSource).toContain("Test webhook acknowledged");
    expect(routeSource).toContain("[Sendcloud Webhook]");
    expect(routeSource).toContain("duplicate: Boolean(result.duplicate)");
    expect(routeSource).toContain("error.statusCode");

    const handler = readFileSync(join(process.cwd(), "lib/shipping/sendcloud/webhooks.ts"), "utf8");
    expect(handler).toContain("claimSendcloudWebhookEvent");
    expect(handler).toContain('outcome === "duplicate"');
    expect(handler).toContain("updateShippingRecordStatus");
    expect(handler).toContain("onShippingRecordStatusChanged");
    // HMAC block remains certified and unchanged in structure
    expect(handler).toContain("timingSafeEqual");
    expect(handler).toContain("sendcloud-signature");
  });
});
