import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ROOT = process.cwd();

function read(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("Shipping Provider Router — Sendcloud only", () => {
  const originalPublicKey = process.env.SENDCLOUD_PUBLIC_KEY;
  const originalSecretKey = process.env.SENDCLOUD_SECRET_KEY;

  beforeEach(() => {
    delete process.env.SENDCLOUD_PUBLIC_KEY;
    delete process.env.SENDCLOUD_SECRET_KEY;
    vi.resetModules();
  });

  afterEach(() => {
    if (originalPublicKey === undefined) delete process.env.SENDCLOUD_PUBLIC_KEY;
    else process.env.SENDCLOUD_PUBLIC_KEY = originalPublicKey;
    if (originalSecretKey === undefined) delete process.env.SENDCLOUD_SECRET_KEY;
    else process.env.SENDCLOUD_SECRET_KEY = originalSecretKey;
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

  it("uses Sendcloud quotes when configured", async () => {
    process.env.SENDCLOUD_PUBLIC_KEY = "pub_test";
    process.env.SENDCLOUD_SECRET_KEY = "sec_test";

    const { sendcloudAdapter } = await import("@/lib/shipping/pricing/sendcloud-adapter");
    const sendcloudSpy = vi.spyOn(sendcloudAdapter, "getQuotes").mockResolvedValue({
      available: true,
      quotes: [
        {
          id: "sendcloud:test",
          providerId: "sendcloud",
          carrier: "Evri",
          serviceName: "Standard",
          pricePence: 599,
          currency: "GBP",
          estimatedDays: { min: 2, max: 3 },
        },
      ],
    });

    const { fetchShippingQuotesRouted } = await import("@/lib/shipping/providers/router");
    const result = await fetchShippingQuotesRouted(sampleRequest);

    expect(result.providerId).toBe("sendcloud");
    expect(result.quotes[0]?.providerId).toBe("sendcloud");
    expect(sendcloudSpy).toHaveBeenCalled();
  });

  it("returns empty quotes when Sendcloud is not configured", async () => {
    const { fetchShippingQuotesRouted } = await import("@/lib/shipping/providers/router");
    const result = await fetchShippingQuotesRouted(sampleRequest);

    expect(result.providerId).toBe("sendcloud");
    expect(result.quotes).toHaveLength(0);
    expect(result.providerAvailable).toBe(false);
  });

  it("returns Sendcloud as primary provider identity", async () => {
    const { getPrimaryProviderServer } = await import("@/lib/shipping/providers/router");
    expect(getPrimaryProviderServer().id).toBe("sendcloud");
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
  });

  it("defines Sendcloud-only routing in router", () => {
    const router = read("lib/shipping/providers/router.ts");
    expect(router).toContain('PROVIDER_ID: ShippingProviderId = "sendcloud"');
    expect(router).toContain("fetchShippingQuotesRouted");
    expect(router).toContain("createShippingLabelRouted");
    expect(router).toContain("sendcloudAdapter");
  });
});
