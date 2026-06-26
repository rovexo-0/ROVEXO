import type { ConnectorCapabilityFlags } from "@/lib/seller/migration/connectors/types";

export const EMPTY_CAPABILITIES: ConnectorCapabilityFlags = {
  authentication: false,
  apiImport: false,
  fileImport: false,
  bulkImport: false,
  bulkPublish: true,
  categoryMapping: true,
  imageImport: false,
  inventorySync: false,
  priceSync: false,
  orderSync: false,
  statusSync: false,
};

export function mergeCapabilities(
  base: ConnectorCapabilityFlags,
  overrides: Partial<ConnectorCapabilityFlags>,
): ConnectorCapabilityFlags {
  return { ...base, ...overrides };
}

/** Marketplace API platforms — authentication + API import when live. */
export function apiMarketplaceCapabilities(
  extras?: Partial<ConnectorCapabilityFlags>,
): ConnectorCapabilityFlags {
  return mergeCapabilities(
    {
      authentication: true,
      apiImport: true,
      fileImport: false,
      bulkImport: true,
      bulkPublish: true,
      categoryMapping: true,
      imageImport: true,
      inventorySync: false,
      priceSync: false,
      orderSync: false,
      statusSync: false,
    },
    extras ?? {},
  );
}

/** E-commerce platforms with store + API + file fallbacks. */
export function ecommerceCapabilities(
  extras?: Partial<ConnectorCapabilityFlags>,
): ConnectorCapabilityFlags {
  return mergeCapabilities(
    {
      authentication: true,
      apiImport: true,
      fileImport: true,
      bulkImport: true,
      bulkPublish: true,
      categoryMapping: true,
      imageImport: true,
      inventorySync: true,
      priceSync: true,
      orderSync: false,
      statusSync: true,
    },
    extras ?? {},
  );
}

/** File-only connectors (CSV, XLSX, XML). */
export function fileCapabilities(
  extras?: Partial<ConnectorCapabilityFlags>,
): ConnectorCapabilityFlags {
  return mergeCapabilities(
    {
      authentication: false,
      apiImport: false,
      fileImport: true,
      bulkImport: true,
      bulkPublish: true,
      categoryMapping: true,
      imageImport: true,
      inventorySync: false,
      priceSync: false,
      orderSync: false,
      statusSync: false,
    },
    extras ?? {},
  );
}

/** Classifieds / C2C marketplaces — mostly stub until official APIs. */
export function classifiedsCapabilities(
  extras?: Partial<ConnectorCapabilityFlags>,
): ConnectorCapabilityFlags {
  return mergeCapabilities(
    {
      authentication: false,
      apiImport: false,
      fileImport: false,
      bulkImport: true,
      bulkPublish: true,
      categoryMapping: true,
      imageImport: true,
      inventorySync: false,
      priceSync: false,
      orderSync: false,
      statusSync: false,
    },
    extras ?? {},
  );
}
