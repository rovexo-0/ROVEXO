import { describe, expect, it, vi } from "vitest";
import { createConnector } from "@/lib/seller/migration/connectors/factory";
import { hasLiveApiCredentials } from "@/lib/seller/migration/connectors/base-connector";
import { resolveEbayApiBase } from "@/lib/seller/migration/connectors/api/ebay-client";
import {
  resolveEtsyApiBase,
  resolveEtsyApiKey,
  resolveEtsyShopId,
} from "@/lib/seller/migration/connectors/api/etsy-client";

describe("tier 2a connectors", () => {
  it("registers eBay and Etsy as live API integrations", () => {
    const ebay = createConnector("ebay");
    expect(ebay.definition.integrationStatus).toBe("api");
    expect(ebay.definition.implementation).toBe("api_ebay");
    expect(ebay.definition.capabilities.apiImport).toBe(true);
    expect(ebay.definition.capabilities.imageImport).toBe(true);
    expect(ebay.definition.capabilities.priceSync).toBe(true);
    expect(ebay.definition.capabilities.authentication).toBe(true);

    const etsy = createConnector("etsy");
    expect(etsy.definition.integrationStatus).toBe("api");
    expect(etsy.definition.implementation).toBe("api_etsy");
    expect(etsy.definition.capabilities.inventorySync).toBe(true);
    expect(etsy.definition.capabilities.categoryMapping).toBe(true);
  });

  it("resolves eBay API base for production and sandbox", () => {
    expect(resolveEbayApiBase()).toContain("api.ebay.com");
    expect(resolveEbayApiBase({ sandbox: true })).toContain("sandbox.ebay.com");
  });

  it("resolves Etsy API base and shop id", () => {
    expect(resolveEtsyApiBase()).toContain("etsy.com");
    expect(resolveEtsyShopId("12345", {})).toBe(12345);
    expect(resolveEtsyShopId(undefined, { shopId: 99 })).toBe(99);
    expect(resolveEtsyShopId(undefined, { etsyShopId: "42" })).toBe(42);
  });

  it("resolves Etsy API key from env when connect payload omits apiKey", () => {
    vi.stubEnv("ETSY_API_KEYSTRING", "test-keystring");
    expect(resolveEtsyApiKey()).toBe("test-keystring");
    vi.unstubAllEnvs();
  });

  it("validates eBay configuration requires access token", async () => {
    const ebay = createConnector("ebay");
    const result = await ebay.validateConfiguration({
      sellerId: "seller-1",
      platform: "ebay",
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]?.field).toBe("accessToken");
  });

  it("validates Etsy configuration requires access token and api key", async () => {
    vi.unstubAllEnvs();
    const etsy = createConnector("etsy");
    const result = await etsy.validateConfiguration({
      sellerId: "seller-1",
      platform: "etsy",
      accessToken: "token",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "apiKey")).toBe(true);
  });

  it("registers eBay and Etsy in the marketplace provider registry", async () => {
    const { getMarketplaceRegistryEntry } = await import("@/lib/seller/marketplace/registry");
    const ebay = getMarketplaceRegistryEntry("ebay");
    const etsy = getMarketplaceRegistryEntry("etsy");
    expect(ebay.integrationStatus).toBe("api");
    expect(etsy.integrationStatus).toBe("api");
    expect(ebay.authenticationType).toBe("oauth2");
    expect(etsy.supportedFeatures).toContain("Image Import");
    expect(ebay.supportedFeatures).toContain("Category Mapping");
  });

  it("exposes live API health verification for Tier 2A platforms", async () => {
    const { verifyConnectorApiHealth } = await import(
      "@/lib/seller/migration/connectors/health"
    );
    const credentials = await import("@/lib/seller/migration/connectors/credentials");
    vi.spyOn(credentials, "loadConnectorCredentials").mockResolvedValue(null);

    expect(verifyConnectorApiHealth).toBeTypeOf("function");
    await expect(verifyConnectorApiHealth("seller-1", "ebay")).rejects.toThrow(
      /not connected/i,
    );

    vi.restoreAllMocks();
  });

  it("does not invoke connect handlers during fetchListings", async () => {
    const source = await import("node:fs/promises").then((fs) =>
      fs.readFile("lib/seller/migration/connectors/base-connector.ts", "utf8"),
    );
    const fetchBlock = source.slice(
      source.indexOf("async fetchListings"),
      source.indexOf("async cancelImport"),
    );
    expect(fetchBlock).not.toContain("this.handlers.connect");
  });

  it("requires platform-specific credentials for live API estimates", async () => {
    const credentials = await import("@/lib/seller/migration/connectors/credentials");
    const loadSpy = vi.spyOn(credentials, "loadConnectorCredentials").mockResolvedValue(null);
    await expect(hasLiveApiCredentials("seller-1", "ebay")).resolves.toBe(false);
    await expect(hasLiveApiCredentials("seller-1", "etsy")).resolves.toBe(false);

    loadSpy.mockResolvedValue({ accessToken: "token" });
    vi.stubEnv("ETSY_API_KEYSTRING", "etsy-key");
    await expect(hasLiveApiCredentials("seller-1", "ebay")).resolves.toBe(true);
    await expect(hasLiveApiCredentials("seller-1", "etsy")).resolves.toBe(true);

    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
});
