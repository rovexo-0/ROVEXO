import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  mapShippoCarrier,
  mapShippoRateToQuote,
  normalizeCountryCode,
  parseShippoQuoteId,
  toShippoAddress,
} from "@/lib/shipping/pricing/shippo-mappers";
import { shippoAdapter } from "@/lib/shipping/pricing/shippo-adapter";
import { getPrimaryProviderServer } from "@/lib/shipping/providers/router";
import { ShippoError, isShippoError, toShippoError } from "@/lib/shipping/shippo/errors";
import { mapShippoTrackingStatus } from "@/lib/shipping/shippo/status-mapper";
import { ShippoService } from "@/lib/shipping/shippo/service";
import {
  handleShippoWebhookEvent,
  verifyShippoWebhookRequest,
} from "@/lib/shipping/shippo/webhooks";

const sampleAddress = {
  role: "collection" as const,
  fullName: "Jane Seller",
  line1: "10 Downing Street",
  city: "London",
  postcode: "SW1A 2AA",
  country: "United Kingdom",
  validated: false,
};

describe("Shippo Integration v1.0", () => {
  const originalApiKey = process.env.SHIPPO_API_KEY;
  const originalWebhookToken = process.env.SHIPPO_WEBHOOK_TOKEN;

  beforeEach(() => {
    delete process.env.SHIPPO_API_KEY;
    delete process.env.SHIPPO_WEBHOOK_TOKEN;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalApiKey === undefined) {
      delete process.env.SHIPPO_API_KEY;
    } else {
      process.env.SHIPPO_API_KEY = originalApiKey;
    }
    if (originalWebhookToken === undefined) {
      delete process.env.SHIPPO_WEBHOOK_TOKEN;
    } else {
      process.env.SHIPPO_WEBHOOK_TOKEN = originalWebhookToken;
    }
  });

  it("loads SHIPPO_API_KEY only from environment variables", async () => {
    const { isShippoConfigured, getShippoApiKey } = await import("@/lib/shipping/env");

    expect(isShippoConfigured()).toBe(false);
    expect(() => getShippoApiKey()).toThrow(/SHIPPO_API_KEY is not configured/);

    process.env.SHIPPO_API_KEY = "shippo_test_key";
    expect(isShippoConfigured()).toBe(true);
    expect(getShippoApiKey()).toBe("shippo_test_key");
  });

  it("validates Shippo configuration on startup in production", async () => {
    const { validateShippoEnvironmentOnStartup } = await import("@/lib/shipping/env");

    expect(() => validateShippoEnvironmentOnStartup()).not.toThrow();

    vi.stubEnv("NODE_ENV", "production");
    delete process.env.VITEST;
    delete process.env.PLAYWRIGHT_E2E;
    expect(() => validateShippoEnvironmentOnStartup()).toThrow(/SHIPPO_API_KEY is not configured/);

    process.env.SHIPPO_API_KEY = "shippo_test_key";
    expect(() => validateShippoEnvironmentOnStartup()).not.toThrow();
  });

  it("maps Shippo tracking statuses to canonical shipping statuses", () => {
    expect(mapShippoTrackingStatus("DELIVERED")).toBe("delivered");
    expect(mapShippoTrackingStatus("TRANSIT")).toBe("in_transit");
    expect(mapShippoTrackingStatus("FAILURE")).toBe("failed");
  });

  it("wraps unknown errors as ShippoError", () => {
    const error = toShippoError(new Error("network down"), "api_error");
    expect(isShippoError(error)).toBe(true);
    expect(error.code).toBe("api_error");
    expect(new ShippoError("not_configured", "missing key").message).toBe("missing key");
  });

  it("returns degraded health when Shippo is not configured", async () => {
    const health = await ShippoService.checkHealth();
    expect(health.configured).toBe(false);
    expect(health.status).toBe("degraded");
  });

  it("returns healthy status when Shippo API responds", async () => {
    process.env.SHIPPO_API_KEY = "shippo_test_key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ results: [] }), { status: 200 })),
    );

    const health = await ShippoService.checkHealth();
    expect(health.status).toBe("healthy");
    expect(health.configured).toBe(true);
  });

  it("validates addresses via Shippo", async () => {
    process.env.SHIPPO_API_KEY = "shippo_test_key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(input)).toContain("/addresses/");
        expect(new Headers(init?.headers).get("Authorization")).toBe("ShippoToken shippo_test_key");
        return new Response(
          JSON.stringify({
            object_id: "addr_123",
            street1: "10 Downing Street",
            city: "London",
            zip: "SW1A 2AA",
            validation_results: { is_valid: true, messages: [] },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    const result = await ShippoService.validateAddress(sampleAddress);
    expect(result.valid).toBe(true);
    expect(result.shippoAddressId).toBe("addr_123");
  });

  it("creates parcels and shipments for quote generation", async () => {
    process.env.SHIPPO_API_KEY = "shippo_test_key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/parcels/")) {
          return new Response(JSON.stringify({ object_id: "parcel_123" }), { status: 200 });
        }
        if (url.includes("/shipments/") && init?.method === "POST") {
          return new Response(
            JSON.stringify({
              object_id: "shipment_123",
              rates: [
                {
                  object_id: "rate_abc123",
                  amount: "4.95",
                  currency: "GBP",
                  provider: "royal_mail",
                  servicelevel: { name: "Tracked 48" },
                  estimated_days: 2,
                },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }),
    );

    const parcel = await ShippoService.createParcel("medium_parcel");
    expect(parcel.objectId).toBe("parcel_123");

    const quotes = await ShippoService.getQuotes({
      parcelTier: "medium_parcel",
      collectionAddress: sampleAddress,
      deliveryAddress: { ...sampleAddress, role: "delivery", fullName: "John Buyer" },
    });

    expect(quotes.available).toBe(true);
    expect(quotes.quotes[0]?.id).toBe("shippo:rate_abc123");
    expect(quotes.shipmentId).toBe("shipment_123");
  });

  it("generates PDF labels and fetches tracking server-side", async () => {
    process.env.SHIPPO_API_KEY = "shippo_test_key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/transactions/")) {
          return new Response(
            JSON.stringify({
              object_id: "txn_123",
              status: "SUCCESS",
              tracking_number: "TT123456789GB",
              label_url: "https://shippo-delivery.s3.amazonaws.com/label.pdf",
            }),
            { status: 200 },
          );
        }
        if (url.includes("/tracks/") && !url.endsWith("/tracks/")) {
          return new Response(
            JSON.stringify({
              object_id: "track_123",
              tracking_status: { status: "DELIVERED" },
              tracking_history: [{ status: "DELIVERED", status_details: "Delivered", status_date: "2026-07-04T10:00:00Z" }],
            }),
            { status: 200 },
          );
        }
        if (url.endsWith("/tracks/")) {
          return new Response(
            JSON.stringify({
              object_id: "track_123",
              tracking_status: { status: "TRANSIT" },
              tracking_history: [],
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      }),
    );

    const label = await ShippoService.generateLabel("rate_abc123");
    expect(label.pdfUrl).toContain("label.pdf");
    expect(label.trackingNumber).toBe("TT123456789GB");

    const tracking = await ShippoService.getTracking("royal_mail", "TT123456789GB");
    expect(tracking.status).toBe("in_transit");
  });

  it("verifies webhook tokens and rejects invalid requests", () => {
    process.env.SHIPPO_WEBHOOK_TOKEN = "secret-token";
    vi.stubEnv("NODE_ENV", "production");

    expect(
      verifyShippoWebhookRequest(
        new Request("https://example.com/api/webhooks/shippo", {
          headers: { "x-shippo-webhook-token": "secret-token" },
        }),
      ),
    ).toBe(true);

    expect(
      verifyShippoWebhookRequest(new Request("https://example.com/api/webhooks/shippo")),
    ).toBe(false);
  });

  it("returns provider_not_configured when Shippo is unavailable", async () => {
    expect(shippoAdapter.isConfigured()).toBe(false);

    const response = await shippoAdapter.getQuotes({
      parcelTier: "medium_parcel",
      collectionAddress: sampleAddress,
      deliveryAddress: { ...sampleAddress, role: "delivery", fullName: "John Buyer" },
    });

    expect(response.available).toBe(false);
    expect(response.reason).toBe("provider_not_configured");
  });

  it("uses Parcel2Go as primary provider when configured", () => {
    process.env.PARCEL2GO_CLIENT_ID = "p2g";
    process.env.PARCEL2GO_CLIENT_SECRET = "secret";
    process.env.PARCEL2GO_AUTH_URL = "https://auth.test";
    process.env.PARCEL2GO_API_URL = "https://api.test";

    expect(getPrimaryProviderServer().id).toBe("parcel2go");
  });

  it("keeps Shippo as fallback-only adapter", () => {
    expect(shippoAdapter.id).toBe("shippo");
    process.env.SHIPPO_API_KEY = "shippo_test_key";
    expect(shippoAdapter.isConfigured()).toBe(true);
  });

  it("maps UK addresses and Shippo rates into shipping quotes", () => {
    expect(normalizeCountryCode("United Kingdom")).toBe("GB");
    expect(toShippoAddress(sampleAddress).country).toBe("GB");
    expect(mapShippoCarrier("hermes_uk")).toBe("Evri");
    expect(parseShippoQuoteId("shippo:rate_abc123")).toBe("rate_abc123");

    const quote = mapShippoRateToQuote({
      object_id: "rate_abc123",
      amount: "4.95",
      currency: "GBP",
      provider: "royal_mail",
      servicelevel: { name: "Tracked 48" },
      estimated_days: 2,
    });

    expect(quote).toMatchObject({
      id: "shippo:rate_abc123",
      providerId: "shippo",
      carrier: "Royal Mail",
      serviceName: "Tracked 48",
      pricePence: 495,
      currency: "GBP",
    });
  });

  it("creates labels through the adapter without exposing the API key", async () => {
    process.env.SHIPPO_API_KEY = "shippo_test_key";

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        expect(headers.get("Authorization")).toBe("ShippoToken shippo_test_key");

        return new Response(
          JSON.stringify({
            object_id: "txn_123",
            status: "SUCCESS",
            tracking_number: "TT123456789GB",
            label_url: "https://shippo-delivery.s3.amazonaws.com/label.pdf",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    const response = await shippoAdapter.createLabel({
      quoteId: "shippo:rate_abc123",
      orderId: "00000000-0000-4000-8000-000000000001",
      orderNumber: "RVXTEST",
      parcelTier: "medium_parcel",
      collectionAddress: sampleAddress,
      deliveryAddress: { ...sampleAddress, role: "delivery" },
    });

    expect(response.available).toBe(true);
    expect(response.trackingNumber).toBe("TT123456789GB");
    expect(response.pdfUrl).toContain("label.pdf");
    expect(JSON.stringify(response)).not.toContain("shippo_test_key");
  });

  it("handles track_updated webhooks", async () => {
    process.env.SHIPPO_API_KEY = "shippo_test_key";
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://rovexo-test.supabase.co");
    vi.stubEnv(
      "SUPABASE_SERVICE_ROLE_KEY",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUifQ.test",
    );
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIn0.test",
    );

    const store = await import("@/lib/shipping/store");
    const findSpy = vi.spyOn(store, "findShippingRecordByTrackingNumber").mockResolvedValue({
      id: "rec_1",
      orderId: "00000000-0000-4000-8000-000000000099",
      parcelTier: "medium_parcel",
      status: "in_transit",
      carrier: "Royal Mail",
      trackingNumber: "TT123456789GB",
      collectionAddress: null,
      deliveryAddress: null,
      pricing: null,
      label: null,
      parcels: [],
      trackingEvents: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const updateSpy = vi.spyOn(store, "updateShippingRecordStatus").mockResolvedValue(null);
    const admin = await import("@/lib/supabase/admin");
    const adminChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    const adminSpy = vi
      .spyOn(admin, "createAdminClient")
      .mockReturnValue({ from: vi.fn().mockReturnValue(adminChain) } as never);

    const result = await handleShippoWebhookEvent({
      event: "track_updated",
      data: {
        tracking_number: "TT123456789GB",
        tracking_status: { status: "DELIVERED" },
        tracking_history: [{ status_details: "Delivered to recipient" }],
      },
    });

    expect(result.handled).toBe(true);
    expect(findSpy).toHaveBeenCalledWith("TT123456789GB");
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: "delivered" }),
    );

    findSpy.mockRestore();
    updateSpy.mockRestore();
    adminSpy.mockRestore();
  });

  it("registers Shippo API routes", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const root = process.cwd();

    expect(readFileSync(join(root, "app/api/webhooks/shippo/route.ts"), "utf8")).toContain(
      "handleShippoWebhookEvent",
    );
    expect(readFileSync(join(root, "app/api/shipping/shippo/health/route.ts"), "utf8")).toContain(
      "ShippoService.checkHealth",
    );
  });
});
