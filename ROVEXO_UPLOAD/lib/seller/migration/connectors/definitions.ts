import {
  apiMarketplaceCapabilities,
  classifiedsCapabilities,
  ecommerceCapabilities,
  fileCapabilities,
} from "@/lib/seller/migration/connectors/capabilities";
import type { ConnectorDefinition } from "@/lib/seller/migration/connectors/types";
import type { MigrationImportMethodId, MigrationPlatformId } from "@/lib/seller/migration/types";

const URL_METHODS = [
  "single_url",
  "multiple_urls",
  "bulk_import",
  "store_import",
  "api_import",
] as const satisfies readonly MigrationImportMethodId[];

const ECOMMERCE_METHODS = [
  "store_import",
  "api_import",
  "bulk_import",
  "csv",
  "xlsx",
  "xml",
] as const satisfies readonly MigrationImportMethodId[];

function classified(
  id: MigrationPlatformId,
  name: string,
): ConnectorDefinition {
  return {
    id,
    name,
    integrationStatus: "stub",
    supportedMethods: [...URL_METHODS],
    capabilities: classifiedsCapabilities(),
    implementation: "stub",
  };
}

export const CONNECTOR_DEFINITIONS: readonly ConnectorDefinition[] = [
  classified("facebook_marketplace", "Facebook Marketplace"),
  {
    id: "ebay",
    name: "eBay",
    integrationStatus: "api",
    supportedMethods: [...URL_METHODS],
    capabilities: apiMarketplaceCapabilities({ inventorySync: true, priceSync: true }),
    implementation: "api_ebay",
  },
  {
    id: "amazon",
    name: "Amazon",
    integrationStatus: "api",
    supportedMethods: [...URL_METHODS],
    capabilities: apiMarketplaceCapabilities({ inventorySync: true, priceSync: true, orderSync: true }),
    implementation: "stub",
  },
  {
    id: "etsy",
    name: "Etsy",
    integrationStatus: "api",
    supportedMethods: [...URL_METHODS],
    capabilities: apiMarketplaceCapabilities({ inventorySync: true, priceSync: true }),
    implementation: "api_etsy",
  },
  classified("vinted", "Vinted"),
  classified("depop", "Depop"),
  {
    id: "shopify",
    name: "Shopify",
    integrationStatus: "api",
    supportedMethods: [...ECOMMERCE_METHODS],
    capabilities: ecommerceCapabilities(),
    implementation: "api_shopify",
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    integrationStatus: "api",
    supportedMethods: [...ECOMMERCE_METHODS],
    capabilities: ecommerceCapabilities(),
    implementation: "api_woocommerce",
  },
  {
    id: "magento",
    name: "Magento",
    integrationStatus: "api",
    supportedMethods: [...ECOMMERCE_METHODS],
    capabilities: ecommerceCapabilities(),
    implementation: "stub",
  },
  {
    id: "bigcommerce",
    name: "BigCommerce",
    integrationStatus: "api",
    supportedMethods: [...ECOMMERCE_METHODS],
    capabilities: ecommerceCapabilities(),
    implementation: "stub",
  },
  classified("opencart", "OpenCart"),
  classified("prestashop", "PrestaShop"),
  {
    id: "wix_stores",
    name: "Wix Stores",
    integrationStatus: "api",
    supportedMethods: [...ECOMMERCE_METHODS],
    capabilities: ecommerceCapabilities({ orderSync: false }),
    implementation: "stub",
  },
  classified("squarespace", "Squarespace"),
  classified("gumtree", "Gumtree"),
  classified("craigslist", "Craigslist"),
  classified("mercari", "Mercari"),
  classified("offerup", "OfferUp"),
  classified("olx", "OLX"),
  classified("wallapop", "Wallapop"),
  classified("kleinanzeigen", "Kleinanzeigen"),
  classified("leboncoin", "Leboncoin"),
  classified("marktplaats", "Marktplaats"),
  classified("allegro", "Allegro"),
  classified("subito", "Subito"),
  classified("kijiji", "Kijiji"),
  {
    id: "csv",
    name: "CSV",
    integrationStatus: "file",
    supportedMethods: ["csv", "bulk_import"],
    capabilities: fileCapabilities(),
    implementation: "file_csv",
  },
  {
    id: "xlsx",
    name: "XLSX",
    integrationStatus: "file",
    supportedMethods: ["xlsx", "bulk_import"],
    capabilities: fileCapabilities(),
    implementation: "file_xlsx",
  },
  {
    id: "xml",
    name: "XML",
    integrationStatus: "file",
    supportedMethods: ["xml", "bulk_import", "store_import"],
    capabilities: fileCapabilities(),
    implementation: "file_xml",
  },
  {
    id: "other",
    name: "Other marketplace",
    integrationStatus: "stub",
    supportedMethods: [
      "single_url",
      "multiple_urls",
      "bulk_import",
      "store_import",
      "csv",
      "xlsx",
      "xml",
      "api_import",
    ],
    capabilities: classifiedsCapabilities({ fileImport: true, apiImport: true, authentication: true }),
    implementation: "stub",
  },
] as const;

const definitionMap = new Map<MigrationPlatformId, ConnectorDefinition>(
  CONNECTOR_DEFINITIONS.map((definition) => [definition.id, definition]),
);

export function getConnectorDefinition(
  platform: MigrationPlatformId,
): ConnectorDefinition {
  return definitionMap.get(platform) ?? definitionMap.get("other")!;
}

export function listConnectorDefinitions(): ConnectorDefinition[] {
  return [...CONNECTOR_DEFINITIONS];
}

export const CONNECTOR_PLATFORM_IDS = CONNECTOR_DEFINITIONS.map((d) => d.id);
