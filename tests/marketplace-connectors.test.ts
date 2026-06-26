import { describe, expect, it } from "vitest";
import { CONNECTOR_DEFINITIONS } from "@/lib/seller/migration/connectors/definitions";
import {
  listMarketplaceRegistry,
  getMarketplaceRegistryEntry,
  listSupportedFeatures,
  resolveAuthenticationType,
  toMarketplaceCapabilities,
  MARKETPLACE_PROVIDER_VERSION,
} from "@/lib/seller/marketplace";

describe("marketplace connector layer", () => {
  it("auto-registers every universal connector as a marketplace provider", () => {
    const registry = listMarketplaceRegistry();
    expect(registry.length).toBe(CONNECTOR_DEFINITIONS.length);
    expect(registry.length).toBeGreaterThanOrEqual(30);
  });

  it("exposes registry metadata for each provider", () => {
    for (const entry of listMarketplaceRegistry()) {
      expect(entry.id).toBeTruthy();
      expect(entry.name).toBeTruthy();
      expect(entry.logo).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.version).toBe(MARKETPLACE_PROVIDER_VERSION);
      expect(entry.capabilities).toBeDefined();
      expect(entry.authenticationType).toBeTruthy();
      expect(entry.importMethods.length).toBeGreaterThan(0);
      expect(entry.supportedFeatures.length).toBeGreaterThan(0);
    }
  });

  it("only advertises capabilities that are supported", () => {
    for (const entry of listMarketplaceRegistry()) {
      const { capabilities } = entry;
      const features = listSupportedFeatures(capabilities);

      if (!capabilities.authentication) {
        expect(features).not.toContain("Authentication");
      }
      if (!capabilities.csvImport) {
        expect(features).not.toContain("CSV");
      }
      if (!capabilities.bulkPublish) {
        expect(features).not.toContain("Bulk Publish");
      }
    }
  });

  it("resolves authentication types from integration method", () => {
    const csv = getMarketplaceRegistryEntry("csv");
    expect(csv.authenticationType).toBe("csv");

    const shopify = getMarketplaceRegistryEntry("shopify");
    expect(["oauth2", "api_key", "bearer_token"]).toContain(shopify.authenticationType);
  });

  it("maps connector flags into marketplace capabilities", () => {
    const definition = CONNECTOR_DEFINITIONS.find((item) => item.id === "woocommerce");
    expect(definition).toBeDefined();

    const capabilities = toMarketplaceCapabilities(
      definition!.capabilities,
      definition!.supportedMethods,
    );
    expect(capabilities.reports).toBe(true);
    expect(capabilities.duplicateDetection).toBe(true);
    expect(resolveAuthenticationType(
      definition!.integrationStatus,
      definition!.supportedMethods,
      definition!.capabilities,
    )).toBeTruthy();
  });
});
