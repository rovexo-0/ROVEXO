import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

import {
  mapAddressToParcel2Go,
  mapCountryToParcel2Go,
  mapParcel2GoCreateOrderToShipment,
  mapParcel2GoLabelResponse,
  mapParcel2GoOrderStatus,
  mapParcel2GoQuotesResponse,
  mapParcel2GoTrackingToStatus,
  mapParcel2GoWebhookStatus,
} from "@/src/services/shipping/parcel2go/mapper";
import { parcelTierToDimensions } from "@/lib/shipping/parcels";
import { encodeParcel2GoQuoteId } from "@/src/services/shipping/parcel2go/quote-id";
import { parcel2GoProvider } from "@/src/services/shipping/parcel2go/provider";
import {
  assertParcel2GoWebhookNotReplayed,
  handleParcel2GoWebhookRequest,
  isSupportedParcel2GoWebhookEvent,
  PARCEL2GO_WEBHOOK_REPLAY_WINDOW_MS,
  verifyParcel2GoWebhookSignature,
} from "@/src/services/shipping/parcel2go/webhooks";
import { clearParcel2GoTokenCache } from "@/src/services/shipping/parcel2go/auth";
import { ShipmentError } from "@/src/services/shipping/errors";

const sampleAddress = {
  fullName: "Jane Seller",
  line1: "10 Downing Street",
  city: "London",
  postcode: "SW1A 2AA",
  country: "United Kingdom",
};

const sampleParcel = {
  weightKg: 2,
  lengthCm: 30,
  widthCm: 20,
  heightCm: 10,
  valueGbp: 50,
};

const sampleQuote = {
  Service: { Slug: "evri-standard", Name: "Standard", CourierName: "Evri" },
  TotalPrice: 4.99,
  CurrencyCode: "GBP",
  EstimatedDeliveryDate: "2026-07-10T00:00:00.000Z",
  CutOff: "2026-07-07T17:00:00.000Z",
};

describe("Parcel2Go Production Integration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearParcel2GoTokenCache();
    process.env.PARCEL2GO_CLIENT_ID = "client-id";
    process.env.PARCEL2GO_CLIENT_SECRET = "client-secret";
    process.env.PARCEL2GO_AUTH_URL = "https://www.parcel2go.com/auth";
    process.env.PARCEL2GO_API_URL = "https://www.parcel2go.com";
    process.env.PARCEL2GO_WEBHOOK_SECRET = "webhook-secret";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearParcel2GoTokenCache();
    process.env = { ...originalEnv };
  });

  it("maps live quote payloads with carrier, price, ETA, VAT, currency and service code", () => {
    const quoteId = encodeParcel2GoQuoteId(sampleQuote);
    const quotes = mapParcel2GoQuotesResponse({
      Quotes: [
        {
          ...sampleQuote,
          TotalVat: 0.83,
          TotalPriceExVat: 4.16,
        },
      ],
    });

    expect(quotes).toHaveLength(1);
    expect(quotes[0]?.provider).toBe("parcel2go");
    expect(quotes[0]?.rates[0]?.carrier).toBe("Evri");
    expect(quotes[0]?.rates[0]?.amount).toBe(4.99);
    expect(quotes[0]?.rates[0]?.vatAmount).toBe(0.83);
    expect(quotes[0]?.rates[0]?.priceExVat).toBe(4.16);
    expect(quotes[0]?.rates[0]?.serviceCode).toBe("evri-standard");
    expect(quotes[0]?.rates[0]?.estimatedDeliveryAt).toBe("2026-07-10T00:00:00.000Z");
    expect(quoteId.startsWith("parcel2go:")).toBe(true);
  });

  it("derives parcel dimensions from order tier instead of hardcoded values", () => {
    const small = parcelTierToDimensions("small_parcel");
    const medium = parcelTierToDimensions("medium_parcel");
    expect(small.weightKg).toBeGreaterThan(0);
    expect(small.lengthCm).toBe(45);
    expect(medium.lengthCm).toBe(61);
    expect(small.weightKg).toBeLessThan(medium.weightKg);
  });

  it("creates shipment, pays with prepay, and fetches label PDF", async () => {
    const quoteId = encodeParcel2GoQuoteId(sampleQuote);
    const orderLineHmac = "line-hmac-123";

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/connect/token")) {
          return new Response(
            JSON.stringify({ access_token: "token-123", expires_in: 7200, token_type: "Bearer" }),
            { status: 200 },
          );
        }
        if (url.includes("/api/quotes")) {
          return new Response(JSON.stringify({ Quotes: [sampleQuote] }), { status: 200 });
        }
        if (url.includes("/api/orders") && init?.method === "POST" && !url.includes("paywithprepay")) {
          return new Response(
            JSON.stringify({
              OrderId: "p2g-order-1",
              TotalPrice: 4.99,
              OrderlineIdMap: [{ OrderLineId: "line-1", OrderLineIdHmac: orderLineHmac }],
            }),
            { status: 200 },
          );
        }
        if (url.includes("/paywithprepay")) {
          return new Response(
            JSON.stringify({ Status: "Paid", TrackingNumber: "TRACK123" }),
            { status: 200 },
          );
        }
        if (url.includes("/api/labels/")) {
          return new Response(
            JSON.stringify({
              LabelUrl: "https://www.parcel2go.com/labels/label.pdf",
              TrackingNumber: "TRACK123",
              Format: "pdf",
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({}), { status: 404 });
      }),
    );

    const quotes = await parcel2GoProvider.getQuotes({
      collectionAddress: sampleAddress,
      deliveryAddress: sampleAddress,
      parcels: [sampleParcel],
    });
    expect(quotes[0]?.rates[0]?.carrier).toBe("Evri");

    const shipment = await parcel2GoProvider.createOrder({
      quoteId,
      rateId: "evri-standard",
      reference: "ROV-1001",
      collectionAddress: sampleAddress,
      deliveryAddress: sampleAddress,
      parcels: [sampleParcel],
      insuranceValueGbp: 50,
    });
    expect(shipment.providerOrderId).toBe("p2g-order-1");
    expect(shipment.orderLineIdHmac).toBe(orderLineHmac);

    const paid = await parcel2GoProvider.payOrder({
      shipmentId: shipment.providerOrderId,
      paymentMethod: "prepay",
    });
    expect(paid.status).toBe("paid");
    expect(paid.trackingNumber).toBe("TRACK123");

    const labels = await parcel2GoProvider.getLabels({
      shipmentId: paid.providerOrderId,
      orderLineIdHmac: paid.orderLineIdHmac ?? shipment.orderLineIdHmac ?? undefined,
    });
    expect(labels[0]?.url).toContain("label.pdf");
    expect(labels[0]?.trackingNumber).toBe("TRACK123");
  });

  it("fetches tracking with status mapping and estimated delivery", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/connect/token")) {
          return new Response(
            JSON.stringify({ access_token: "token-123", expires_in: 7200, token_type: "Bearer" }),
            { status: 200 },
          );
        }
        if (url.includes("/api/tracking/")) {
          return new Response(
            JSON.stringify({
              TrackingNumber: "TRACK123",
              CourierName: "Evri",
              Status: "InTransit",
              EstimatedDeliveryDate: "2026-07-10T00:00:00.000Z",
              Events: [
                {
                  EventId: "evt-1",
                  Status: "InTransit",
                  Description: "Parcel in transit",
                  Date: "2026-07-07T10:00:00.000Z",
                },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({}), { status: 404 });
      }),
    );

    const tracking = await parcel2GoProvider.getTracking({
      shipmentId: "p2g-order-1",
      trackingNumber: "TRACK123",
    });

    expect(tracking.status).toBe("in_transit");
    expect(tracking.estimatedDeliveryAt).toBe("2026-07-10T00:00:00.000Z");
    expect(tracking.events).toHaveLength(1);
  });

  it("rejects cancellation because Parcel2Go public API does not expose it", async () => {
    const { cancelParcel2GoShipment } = await import("@/src/services/shipping/parcel2go/orders");
    const { Parcel2GoClient } = await import("@/src/services/shipping/parcel2go/client");
    const client = new Parcel2GoClient();
    await expect(cancelParcel2GoShipment(client, "order-1")).rejects.toBeInstanceOf(ShipmentError);
  });

  it("verifies and processes webhook events with replay protection", async () => {
    const rawBody = JSON.stringify({
      eventType: "shipment.in_transit",
      orderId: "p2g-order-1",
      trackingNumber: "TRACK123",
      carrier: "Evri",
      occurredAt: new Date().toISOString(),
    });
    const signature = createHmac("sha256", "webhook-secret").update(rawBody, "utf8").digest("hex");

    expect(isSupportedParcel2GoWebhookEvent("shipment.in_transit")).toBe(true);
    expect(mapParcel2GoWebhookStatus("shipment.delivered")).toBe("delivered");

    expect(() => verifyParcel2GoWebhookSignature(rawBody, `sha256=${signature}`)).not.toThrow();
    const verified = handleParcel2GoWebhookRequest({
      rawBody,
      signatureHeader: `sha256=${signature}`,
    });
    expect(verified.payload.trackingNumber).toBe("TRACK123");
    expect(verified.signature).toBe(signature);

    const staleBody = JSON.stringify({
      eventType: "shipment.in_transit",
      occurredAt: new Date(Date.now() - PARCEL2GO_WEBHOOK_REPLAY_WINDOW_MS - 1_000).toISOString(),
    });
    expect(() =>
      assertParcel2GoWebhookNotReplayed(JSON.parse(staleBody) as { occurredAt: string }),
    ).toThrow(/replay window/);
  });

  it("supports and maps every documented Parcel2Go webhook event type", () => {
    const cases: { event: string; status: string | null }[] = [
      { event: "ShipmentCreated", status: "paid" },
      { event: "ShipmentUpdated", status: null },
      { event: "InTransit", status: "in_transit" },
      { event: "OutForDelivery", status: "out_for_delivery" },
      { event: "Delivered", status: "delivered" },
      { event: "Exception", status: "failed" },
      { event: "Cancelled", status: "cancelled" },
      { event: "Return", status: "returned" },
      { event: "Unknown", status: null },
    ];

    for (const { event, status } of cases) {
      expect(mapParcel2GoWebhookStatus(event)).toBe(status);
    }

    // Provider punctuation/casing variants all resolve as supported.
    expect(isSupportedParcel2GoWebhookEvent("shipment.created")).toBe(true);
    expect(isSupportedParcel2GoWebhookEvent("shipment_out_for_delivery")).toBe(true);
    expect(isSupportedParcel2GoWebhookEvent("Return")).toBe(true);
    expect(isSupportedParcel2GoWebhookEvent("OutForDelivery")).toBe(true);
    // "OutForDelivery" must not be misread as "Delivered".
    expect(mapParcel2GoWebhookStatus("OutForDelivery")).not.toBe("delivered");
  });

  it("retries retryable API failures", async () => {
    const { Parcel2GoClient } = await import("@/src/services/shipping/parcel2go/client");
    let attempts = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/connect/token")) {
          return new Response(
            JSON.stringify({ access_token: "token-123", expires_in: 7200, token_type: "Bearer" }),
            { status: 200 },
          );
        }
        attempts += 1;
        if (attempts === 1) {
          return new Response(JSON.stringify({ message: "busy" }), { status: 503 });
        }
        return new Response(JSON.stringify({ Quotes: [sampleQuote] }), { status: 200 });
      }),
    );

    const client = new Parcel2GoClient({ retries: 2 });
    const response = await client.post<{ Quotes: unknown[] }>("/api/quotes", {
      CollectionAddress: mapAddressToParcel2Go(sampleAddress),
      DeliveryAddress: mapAddressToParcel2Go(sampleAddress),
      Parcels: [{ Weight: 2, Length: 30, Width: 20, Height: 10 }],
    });

    expect(response.Quotes).toHaveLength(1);
    expect(attempts).toBe(2);
  });

  it("maps order and label wire payloads into ROVEXO DTOs", () => {
    expect(mapCountryToParcel2Go("United Kingdom")).toBe("GBR");
    expect(mapAddressToParcel2Go(sampleAddress).Country).toBe("GBR");
    expect(mapParcel2GoOrderStatus("InTransit")).toBe("in_transit");

    const shipment = mapParcel2GoCreateOrderToShipment(
      {
        OrderId: "order-1",
        OrderlineIdMap: [{ OrderLineId: "line-1", OrderLineIdHmac: "hmac-1" }],
      },
      "ROV-1001",
    );
    expect(shipment.status).toBe("pending_payment");
    expect(shipment.providerReference).toBe("ROV-1001");

    const label = mapParcel2GoLabelResponse(
      { LabelUrl: "https://example.com/label.pdf", TrackingNumber: "TRACK123", Format: "pdf" },
      { ...shipment, id: "order-1", provider: "parcel2go", providerOrderId: "order-1", status: "paid", trackingNumber: null, carrier: "Evri", createdAt: "", updatedAt: "" },
    );
    expect(label.url).toContain("label.pdf");

    const tracking = mapParcel2GoTrackingToStatus(
      {
        TrackingNumber: "TRACK123",
        Status: "Delivered",
        Events: [{ Status: "Delivered", Description: "Delivered", Date: "2026-07-07T10:00:00.000Z" }],
      },
      "order-1",
    );
    expect(tracking.status).toBe("delivered");
  });
});
