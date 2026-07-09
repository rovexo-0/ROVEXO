import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("Shipping Provider Router — Parcel2Go primary, Shippo fallback", () => {
  const originalP2g = {
    clientId: process.env.PARCEL2GO_CLIENT_ID,
    clientSecret: process.env.PARCEL2GO_CLIENT_SECRET,
    authUrl: process.env.PARCEL2GO_AUTH_URL,
    apiUrl: process.env.PARCEL2GO_API_URL,
  };
  const originalShippo = process.env.SHIPPO_API_KEY;

  beforeEach(() => {
    delete process.env.PARCEL2GO_CLIENT_ID;
    delete process.env.PARCEL2GO_CLIENT_SECRET;
    delete process.env.PARCEL2GO_AUTH_URL;
    delete process.env.PARCEL2GO_API_URL;
    delete process.env.SHIPPO_API_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    for (const [key, value] of Object.entries(originalP2g)) {
      const envKey = key === "clientId" ? "PARCEL2GO_CLIENT_ID" : key === "clientSecret" ? "PARCEL2GO_CLIENT_SECRET" : key === "authUrl" ? "PARCEL2GO_AUTH_URL" : "PARCEL2GO_API_URL";
      if (value === undefined) delete process.env[envKey];
      else process.env[envKey] = value;
    }
    if (originalShippo === undefined) delete process.env.SHIPPO_API_KEY;
    else process.env.SHIPPO_API_KEY = originalShippo;
  });

  const sampleRequest = {
    parcelTier: "medium_parcel" as const,
    collectionAddress: {
      role: "collection" as const,
      fullName: "Seller",
      line1: "10 Downing Street",
      city: "London",
      postcode: "SW1A 2AA",
      country: "United Kingdom",
      validated: true,
    },
    deliveryAddress: {
      role: "delivery" as const,
      fullName: "Buyer",
      line1: "221B Baker Street",
      city: "London",
      postcode: "NW1 6XE",
      country: "United Kingdom",
      validated: true,
    },
  };

  it("uses Parcel2Go quotes when primary is available", async () => {
    process.env.PARCEL2GO_CLIENT_ID = "p2g";
    process.env.PARCEL2GO_CLIENT_SECRET = "secret";
    process.env.PARCEL2GO_AUTH_URL = "https://auth.test";
    process.env.PARCEL2GO_API_URL = "https://api.test";
    process.env.SHIPPO_API_KEY = "shippo_test";

    const { parcel2GoAdapter } = await import("@/lib/shipping/pricing/parcel2go-adapter");
    const { shippoAdapter } = await import("@/lib/shipping/pricing/shippo-adapter");
    const p2gSpy = vi.spyOn(parcel2GoAdapter, "getQuotes").mockResolvedValue({
      available: true,
      quotes: [
        {
          id: "parcel2go:test",
          providerId: "parcel2go",
          carrier: "Evri",
          serviceName: "Standard",
          pricePence: 599,
          currency: "GBP",
          estimatedDays: { min: 2, max: 3 },
        },
      ],
    });
    const shippoSpy = vi.spyOn(shippoAdapter, "getQuotes");

    const { fetchShippingQuotesRouted } = await import("@/lib/shipping/providers/router");
    const result = await fetchShippingQuotesRouted(sampleRequest);

    expect(result.providerId).toBe("parcel2go");
    expect(result.usedFallback).toBe(false);
    expect(result.quotes[0]?.providerId).toBe("parcel2go");
    expect(p2gSpy).toHaveBeenCalled();
    expect(shippoSpy).not.toHaveBeenCalled();
  });

  it("falls back to Shippo when Parcel2Go returns no services", async () => {
    process.env.PARCEL2GO_CLIENT_ID = "p2g";
    process.env.PARCEL2GO_CLIENT_SECRET = "secret";
    process.env.PARCEL2GO_AUTH_URL = "https://auth.test";
    process.env.PARCEL2GO_API_URL = "https://api.test";
    process.env.SHIPPO_API_KEY = "shippo_test";

    const { parcel2GoAdapter } = await import("@/lib/shipping/pricing/parcel2go-adapter");
    const { shippoAdapter } = await import("@/lib/shipping/pricing/shippo-adapter");
    vi.spyOn(parcel2GoAdapter, "getQuotes").mockResolvedValue({
      available: false,
      quotes: [],
      reason: "no_services",
    });
    vi.spyOn(shippoAdapter, "getQuotes").mockResolvedValue({
      available: true,
      quotes: [
        {
          id: "shippo:rate_1",
          providerId: "shippo",
          carrier: "Royal Mail",
          serviceName: "Tracked 48",
          pricePence: 495,
          currency: "GBP",
          estimatedDays: { min: 2, max: 2 },
        },
      ],
    });

    const { fetchShippingQuotesRouted } = await import("@/lib/shipping/providers/router");
    const result = await fetchShippingQuotesRouted(sampleRequest);

    expect(result.providerId).toBe("shippo");
    expect(result.usedFallback).toBe(true);
    expect(result.fallbackReason).toBe("service_unavailable");
  });

  it("returns Parcel2Go as primary provider identity", async () => {
    const { getPrimaryProviderServer } = await import("@/lib/shipping/providers/router");
    expect(getPrimaryProviderServer().id).toBe("parcel2go");
  });
});

describe("Shipping architecture freeze", () => {
  it("routes all label generation through the provider router", () => {
    const labels = read("lib/shipping/labels/service.server.ts");
    expect(labels).toContain("createShippingLabelRouted");
    expect(labels).not.toContain("getPrimaryProviderServer().createLabel");
  });

  it("exposes canonical provider-agnostic labels API", () => {
    expect(read("app/api/shipping/labels/route.ts")).toContain("generateShippingLabelForOrder");
  });

  it("seller UI uses canonical labels endpoint", () => {
    const parcelCard = read("features/shipping/components/ParcelCard.tsx");
    expect(parcelCard).toContain("/api/shipping/labels");
    expect(parcelCard).not.toContain("/api/shipping/parcel2go/labels");
  });

  it("defines Parcel2Go primary and Shippo fallback in router", () => {
    const router = read("lib/shipping/providers/router.ts");
    expect(router).toContain('PRIMARY_ID: ShippingProviderId = "parcel2go"');
    expect(router).toContain('FALLBACK_ID: ShippingProviderId = "shippo"');
    expect(router).toContain("fetchShippingQuotesRouted");
    expect(router).toContain("createShippingLabelRouted");
  });
});
