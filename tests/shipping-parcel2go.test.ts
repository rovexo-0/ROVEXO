import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

import {
  mapAddressToParcel2Go,
  mapCountryToParcel2Go,
  mapParcel2GoCreateOrderToShipment,
  mapParcel2GoOrderStatus,
  mapParcel2GoQuotesResponse,
  mapParcel2GoTrackingToStatus,
} from "@/src/services/shipping/parcel2go/mapper";
import {
  validateCancelShipmentRequest,
  validateCreateOrderRequest,
  validateGetQuotesRequest,
} from "@/src/services/shipping/parcel2go/validators";
import {
  clearParcel2GoTokenCache,
  getCachedTokenExpiry,
  getParcel2GoAccessToken,
  isCachedTokenValid,
  TOKEN_REFRESH_BUFFER_MS,
} from "@/src/services/shipping/parcel2go/auth";
import { Parcel2GoClient } from "@/src/services/shipping/parcel2go/client";
import { parcel2GoProvider } from "@/src/services/shipping/parcel2go/provider";
import {
  handleParcel2GoWebhookRequest,
  verifyParcel2GoWebhookSignature,
} from "@/src/services/shipping/parcel2go/webhooks";
import {
  AuthenticationError,
  ValidationError,
  isShippingError,
  toShippingError,
} from "@/src/services/shipping/errors";
import { getPrimaryShippingProvider } from "@/src/services/shipping";

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

describe("Parcel2Go Shipping Engine v1.0 Foundation", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearParcel2GoTokenCache();
    delete process.env.PARCEL2GO_CLIENT_ID;
    delete process.env.PARCEL2GO_CLIENT_SECRET;
    delete process.env.PARCEL2GO_AUTH_URL;
    delete process.env.PARCEL2GO_API_URL;
    delete process.env.PARCEL2GO_WEBHOOK_SECRET;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearParcel2GoTokenCache();
    process.env = { ...originalEnv };
  });

  it("loads Parcel2Go credentials only from environment variables", async () => {
    const { isParcel2GoConfigured, getParcel2GoClientId } = await import("@/src/services/shipping/env");

    expect(isParcel2GoConfigured()).toBe(false);
    expect(() => getParcel2GoClientId()).toThrow(/PARCEL2GO_CLIENT_ID is not configured/);

    process.env.PARCEL2GO_CLIENT_ID = "client-id";
    process.env.PARCEL2GO_CLIENT_SECRET = "client-secret";
    process.env.PARCEL2GO_AUTH_URL = "https://sandbox.parcel2go.com/auth";
    process.env.PARCEL2GO_API_URL = "https://sandbox.parcel2go.com";

    expect(isParcel2GoConfigured()).toBe(true);
    expect(getParcel2GoClientId()).toBe("client-id");
  });

  it("validates Parcel2Go configuration on startup in production", async () => {
    const { validateParcel2GoEnvironmentOnStartup } = await import("@/src/services/shipping/env");

    expect(() => validateParcel2GoEnvironmentOnStartup()).not.toThrow();

    vi.stubEnv("NODE_ENV", "production");
    delete process.env.VITEST;
    delete process.env.PLAYWRIGHT_E2E;
    expect(() => validateParcel2GoEnvironmentOnStartup()).toThrow(/Parcel2Go is not fully configured/);

    process.env.PARCEL2GO_CLIENT_ID = "client-id";
    process.env.PARCEL2GO_CLIENT_SECRET = "client-secret";
    process.env.PARCEL2GO_AUTH_URL = "https://sandbox.parcel2go.com/auth";
    process.env.PARCEL2GO_API_URL = "https://sandbox.parcel2go.com";
    expect(() => validateParcel2GoEnvironmentOnStartup()).not.toThrow();
  });

  it("resolves the official Parcel2Go token endpoint", async () => {
    process.env.PARCEL2GO_CLIENT_ID = "client-id";
    process.env.PARCEL2GO_CLIENT_SECRET = "client-secret";
    process.env.PARCEL2GO_API_URL = "https://www.parcel2go.com";

    const { getParcel2GoTokenUrl, detectParcel2GoEnvironment } = await import("@/src/services/shipping/env");

    process.env.PARCEL2GO_AUTH_URL = "https://www.parcel2go.com/auth";
    expect(getParcel2GoTokenUrl()).toBe("https://www.parcel2go.com/auth/connect/token");
    expect(detectParcel2GoEnvironment()).toBe("production");

    process.env.PARCEL2GO_AUTH_URL = "https://www.parcel2go.com";
    expect(getParcel2GoTokenUrl()).toBe("https://www.parcel2go.com/auth/connect/token");
  });

  it("sends OAuth client credentials exactly as Parcel2Go specifies", async () => {
    process.env.PARCEL2GO_CLIENT_ID = "client-id";
    process.env.PARCEL2GO_CLIENT_SECRET = "client-secret";
    process.env.PARCEL2GO_AUTH_URL = "https://www.parcel2go.com/auth";
    process.env.PARCEL2GO_API_URL = "https://www.parcel2go.com";

    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ access_token: "token-123", expires_in: 7200, token_type: "Bearer" }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await getParcel2GoAccessToken();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://www.parcel2go.com/auth/connect/token");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/x-www-form-urlencoded");

    const body = new URLSearchParams(String(init.body));
    expect(body.get("grant_type")).toBe("client_credentials");
    expect(body.get("scope")).toBe("public-api payment");
    expect(body.get("client_id")).toBe("client-id");
    expect(body.get("client_secret")).toBe("client-secret");
  });

  it("logs structured authentication failures without exposing secrets", async () => {
    process.env.PARCEL2GO_CLIENT_ID = "client-id";
    process.env.PARCEL2GO_CLIENT_SECRET = "client-secret";
    process.env.PARCEL2GO_AUTH_URL = "https://www.parcel2go.com/auth";
    process.env.PARCEL2GO_API_URL = "https://www.parcel2go.com";

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            error: "invalid_client",
            error_description: "Client authentication failed",
          }),
          { status: 401 },
        ),
      ),
    );

    await expect(getParcel2GoAccessToken()).rejects.toBeInstanceOf(AuthenticationError);
    expect(errorSpy).toHaveBeenCalled();
    const logLine = String(errorSpy.mock.calls[0]?.[0] ?? "");
    expect(logLine).toContain("auth");
    expect(logLine).not.toContain("client-secret");
    expect(logLine).not.toContain("token-123");

    errorSpy.mockRestore();
  });

  it("obtains and caches OAuth tokens without requesting on every API call", async () => {
    process.env.PARCEL2GO_CLIENT_ID = "client-id";
    process.env.PARCEL2GO_CLIENT_SECRET = "client-secret";
    process.env.PARCEL2GO_AUTH_URL = "https://sandbox.parcel2go.com/auth";
    process.env.PARCEL2GO_API_URL = "https://sandbox.parcel2go.com";

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/connect/token")) {
        return new Response(
          JSON.stringify({ access_token: "token-123", expires_in: 7200, token_type: "Bearer" }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ Orders: [] }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await getParcel2GoAccessToken();
    const second = await getParcel2GoAccessToken();

    expect(first).toBe("token-123");
    expect(second).toBe("token-123");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const client = new Parcel2GoClient();
    await client.get("/api/orders", { query: { page: 1, pageSize: 1 } });
    await client.get("/api/orders", { query: { page: 1, pageSize: 1 } });

    expect(fetchMock).toHaveBeenCalledTimes(3);

    const apiCalls = fetchMock.mock.calls.filter((call) => String(call[0]).includes("/api/orders"));
    expect(apiCalls).toHaveLength(2);
    for (const call of apiCalls as unknown as Array<[RequestInfo | URL, RequestInit | undefined]>) {
      const headers = new Headers(call[1]?.headers);
      expect(headers.get("Authorization")).toBe("Bearer token-123");
    }
  });

  it("refreshes OAuth token automatically when API returns 401", async () => {
    process.env.PARCEL2GO_CLIENT_ID = "client-id";
    process.env.PARCEL2GO_CLIENT_SECRET = "client-secret";
    process.env.PARCEL2GO_AUTH_URL = "https://www.parcel2go.com/auth";
    process.env.PARCEL2GO_API_URL = "https://www.parcel2go.com";

    let tokenCounter = 0;
    let apiCalls = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/connect/token")) {
          tokenCounter += 1;
          return new Response(
            JSON.stringify({
              access_token: `token-${tokenCounter}`,
              expires_in: 7200,
              token_type: "Bearer",
            }),
            { status: 200 },
          );
        }

        apiCalls += 1;
        if (apiCalls === 1) {
          return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
        }

        return new Response(JSON.stringify({ Orders: [] }), { status: 200 });
      }),
    );

    const client = new Parcel2GoClient({ retries: 0 });
    const result = await client.get<{ Orders: unknown[] }>("/api/orders", {
      query: { page: 1, pageSize: 1 },
    });

    expect(result.Orders).toEqual([]);
    expect(tokenCounter).toBe(2);
    expect(apiCalls).toBe(2);
  });

  it("renews cached tokens before expiry", async () => {
    process.env.PARCEL2GO_CLIENT_ID = "client-id";
    process.env.PARCEL2GO_CLIENT_SECRET = "client-secret";
    process.env.PARCEL2GO_AUTH_URL = "https://sandbox.parcel2go.com/auth";
    process.env.PARCEL2GO_API_URL = "https://sandbox.parcel2go.com";

    let tokenCounter = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        tokenCounter += 1;
        return new Response(
          JSON.stringify({
            access_token: `token-${tokenCounter}`,
            expires_in: 3600,
            token_type: "Bearer",
          }),
          { status: 200 },
        );
      }),
    );

    const first = await getParcel2GoAccessToken();
    expect(first).toBe("token-1");
    expect(isCachedTokenValid()).toBe(true);

    const expiry = getCachedTokenExpiry();
    expect(expiry).not.toBeNull();

    const nowSpy = vi.spyOn(Date, "now");
    nowSpy.mockReturnValue((expiry ?? Date.now()) - TOKEN_REFRESH_BUFFER_MS + 1);

    const second = await getParcel2GoAccessToken();
    expect(second).toBe("token-2");

    nowSpy.mockRestore();
  });

  it("retries retryable Parcel2Go API responses", async () => {
    process.env.PARCEL2GO_CLIENT_ID = "client-id";
    process.env.PARCEL2GO_CLIENT_SECRET = "client-secret";
    process.env.PARCEL2GO_AUTH_URL = "https://sandbox.parcel2go.com/auth";
    process.env.PARCEL2GO_API_URL = "https://sandbox.parcel2go.com";

    let apiAttempts = 0;
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

        apiAttempts += 1;
        if (apiAttempts === 1) {
          return new Response(JSON.stringify({ message: "busy" }), { status: 503 });
        }
        return new Response(JSON.stringify({ Orders: [] }), { status: 200 });
      }),
    );

    const client = new Parcel2GoClient({ retries: 2 });
    const result = await client.get<{ Orders: unknown[] }>("/api/orders", {
      query: { page: 1, pageSize: 1 },
    });

    expect(result.Orders).toEqual([]);
    expect(apiAttempts).toBe(2);
  });

  it("maps Parcel2Go payloads into ROVEXO DTOs", () => {
    expect(mapCountryToParcel2Go("United Kingdom")).toBe("GBR");
    expect(mapAddressToParcel2Go(sampleAddress).Country).toBe("GBR");

    const quotes = mapParcel2GoQuotesResponse({
      Quotes: [
        {
          Service: { CourierName: "Evri", Name: "Standard", Slug: "evri-standard" },
          TotalPrice: 4.99,
          CurrencyCode: "GBP",
        },
      ],
    });

    expect(quotes[0]?.provider).toBe("parcel2go");
    expect(quotes[0]?.rates[0]?.carrier).toBe("Evri");
    expect(quotes[0]?.rates[0]?.amount).toBe(4.99);

    expect(mapParcel2GoOrderStatus("InTransit")).toBe("in_transit");
    expect(
      mapParcel2GoCreateOrderToShipment(
        {
          OrderId: "order-1",
        },
        "ROV-1001",
      ).providerOrderId,
    ).toBe("order-1");

    const tracking = mapParcel2GoTrackingToStatus(
      {
        TrackingNumber: "TRACK123",
        Status: "InTransit",
        Events: [{ Status: "InTransit", Description: "On the way", Date: "2026-07-07T10:00:00.000Z" }],
      },
      "order-1",
    );

    expect(tracking.events).toHaveLength(1);
    expect(tracking.status).toBe("in_transit");
  });

  it("validates quote and order requests", () => {
    expect(() =>
      validateGetQuotesRequest({
        collectionAddress: sampleAddress,
        deliveryAddress: sampleAddress,
        parcels: [sampleParcel],
      }),
    ).not.toThrow();

    expect(() =>
      validateGetQuotesRequest({
        collectionAddress: { ...sampleAddress, postcode: "INVALID" },
        deliveryAddress: sampleAddress,
        parcels: [sampleParcel],
      }),
    ).toThrow(ValidationError);

    expect(() =>
      validateCreateOrderRequest({
        quoteId: "quote-1",
        rateId: "rate-1",
        reference: "ROV-1001",
        collectionAddress: sampleAddress,
        deliveryAddress: sampleAddress,
        parcels: [sampleParcel],
      }),
    ).not.toThrow();

    expect(() => validateCancelShipmentRequest({ shipmentId: "" })).toThrow(ValidationError);
  });

  it("returns degraded health when Parcel2Go is not configured", async () => {
    const health = await parcel2GoProvider.healthCheck();

    expect(health.provider).toBe("parcel2go");
    expect(health.version).toBe("1.0.0");
    expect(health.configured).toBe(false);
    expect(health.credentialsLoaded).toBe(false);
    expect(health.status).toBe("degraded");
    expect(health.oauthOk).toBe(false);
    expect(health.tokenObtained).toBe(false);
    expect(health.tokenValid).toBe(false);
    expect(health.checks.some((check) => check.id === "credentials_loaded" && !check.pass)).toBe(true);
  });

  it("returns healthy status when OAuth and API probe succeed", async () => {
    process.env.PARCEL2GO_CLIENT_ID = "client-id";
    process.env.PARCEL2GO_CLIENT_SECRET = "client-secret";
    process.env.PARCEL2GO_AUTH_URL = "https://sandbox.parcel2go.com/auth";
    process.env.PARCEL2GO_API_URL = "https://sandbox.parcel2go.com";

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
        return new Response(JSON.stringify({ Orders: [] }), { status: 200 });
      }),
    );

    const health = await parcel2GoProvider.healthCheck();

    expect(health.status).toBe("healthy");
    expect(health.credentialsLoaded).toBe(true);
    expect(health.oauthOk).toBe(true);
    expect(health.tokenObtained).toBe(true);
    expect(health.apiReachable).toBe(true);
    expect(health.tokenValid).toBe(true);
    expect(health.tokenExpiresAt).toBeTruthy();
    expect(health.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "credentials_loaded", pass: true }),
        expect.objectContaining({ id: "token_obtained", pass: true }),
        expect.objectContaining({ id: "token_valid", pass: true }),
        expect.objectContaining({ id: "api_reachable", pass: true }),
      ]),
    );
  });

  it("exposes Parcel2Go as the primary pluggable provider", () => {
    const provider = getPrimaryShippingProvider();
    expect(provider.id).toBe("parcel2go");
    expect(provider.name).toBe("Parcel2Go");
    expect(provider.version).toBe("1.0.0");
  });

  it("fetches live quotes when Parcel2Go API is configured", async () => {
    process.env.PARCEL2GO_CLIENT_ID = "client-id";
    process.env.PARCEL2GO_CLIENT_SECRET = "client-secret";
    process.env.PARCEL2GO_AUTH_URL = "https://sandbox.parcel2go.com/auth";
    process.env.PARCEL2GO_API_URL = "https://sandbox.parcel2go.com";

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
        if (url.includes("/api/quotes")) {
          return new Response(
            JSON.stringify({
              Quotes: [
                {
                  Service: { Slug: "evri-standard", Name: "Standard", CourierName: "Evri" },
                  TotalPrice: 4.99,
                  CurrencyCode: "GBP",
                },
              ],
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
  });

  it("verifies Parcel2Go webhook signatures", () => {
    process.env.PARCEL2GO_WEBHOOK_SECRET = "webhook-secret";
    const rawBody = JSON.stringify({ eventType: "tracking.updated", orderId: "order-1" });

    const signature = verifyParcel2GoWebhookSignature.name;
    expect(signature).toBeTruthy();

    const validSignature = createHmac("sha256", "webhook-secret").update(rawBody, "utf8").digest("hex");

    expect(() => verifyParcel2GoWebhookSignature(rawBody, `sha256=${validSignature}`)).not.toThrow();
    expect(() => verifyParcel2GoWebhookSignature(rawBody, "sha256=invalid")).toThrow(/Invalid Parcel2Go webhook signature/);

    const verified = handleParcel2GoWebhookRequest({
      rawBody,
      signatureHeader: `sha256=${validSignature}`,
    });

    expect(verified.payload.orderId).toBe("order-1");
    expect(verified.correlationId).toBeTruthy();
  });

  it("wraps unknown errors as shipping errors", () => {
    const error = toShippingError(new Error("network down"), "authentication");
    expect(isShippingError(error)).toBe(true);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(new AuthenticationError("missing credentials").message).toBe("missing credentials");
  });
});
