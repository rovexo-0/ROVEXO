import type { ConnectorCapabilityFlags } from "@/lib/seller/migration/connectors/types";
import type { MigrationImportMethodId } from "@/lib/seller/migration/types";
import type { MarketplaceAuthenticationType, MarketplaceCapabilityFlags } from "@/lib/seller/marketplace/types";

export function resolveAuthenticationType(
  integrationStatus: "ready" | "stub" | "api" | "file",
  supportedMethods: readonly MigrationImportMethodId[],
  capabilities: ConnectorCapabilityFlags,
): MarketplaceAuthenticationType {
  if (
    integrationStatus === "api" &&
    capabilities.apiImport &&
    supportedMethods.includes("api_import")
  ) {
    return capabilities.authentication ? "oauth2" : "api_key";
  }
  if (supportedMethods.includes("csv")) return "csv";
  if (supportedMethods.includes("xml")) return "xml";
  if (supportedMethods.includes("xlsx")) return "xlsx";
  if (capabilities.fileImport) return "file_upload";
  if (integrationStatus === "stub") return "manual_import";
  if (capabilities.apiImport && supportedMethods.includes("api_import")) {
    return capabilities.authentication ? "oauth2" : "api_key";
  }
  if (capabilities.authentication) return "bearer_token";
  return "none";
}

export function toMarketplaceCapabilities(
  flags: ConnectorCapabilityFlags,
  supportedMethods: readonly MigrationImportMethodId[],
): MarketplaceCapabilityFlags {
  return {
    ...flags,
    urlImport: supportedMethods.includes("single_url") || supportedMethods.includes("multiple_urls"),
    csvImport: supportedMethods.includes("csv"),
    xmlImport: supportedMethods.includes("xml"),
    xlsxImport: supportedMethods.includes("xlsx"),
    duplicateDetection: true,
    productSync: flags.inventorySync || flags.statusSync,
    reports: true,
  };
}

export function listSupportedFeatures(capabilities: MarketplaceCapabilityFlags): string[] {
  const features: string[] = [];
  if (capabilities.authentication) features.push("Authentication");
  if (capabilities.bulkImport) features.push("Bulk Import");
  if (capabilities.urlImport) features.push("URL Import");
  if (capabilities.csvImport) features.push("CSV");
  if (capabilities.xmlImport) features.push("XML");
  if (capabilities.xlsxImport) features.push("XLSX");
  if (capabilities.imageImport) features.push("Image Import");
  if (capabilities.categoryMapping) features.push("Category Mapping");
  if (capabilities.duplicateDetection) features.push("Duplicate Detection");
  if (capabilities.inventorySync) features.push("Inventory Sync");
  if (capabilities.priceSync) features.push("Price Sync");
  if (capabilities.productSync) features.push("Product Sync");
  if (capabilities.statusSync) features.push("Status Sync");
  if (capabilities.bulkPublish) features.push("Bulk Publish");
  if (capabilities.reports) features.push("Reports");
  return features;
}
