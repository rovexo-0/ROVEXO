import { CONNECTOR_PLATFORM_IDS } from "@/lib/seller/migration/connectors/definitions";
import type { MigrationImportMethodId, MigrationPlatformId } from "@/lib/seller/migration/types";
export type MigrationPlatformOption = {
  id: MigrationPlatformId;
  name: string;
  icon: string;
  region?: string;
};

export type MigrationImportMethodOption = {
  id: MigrationImportMethodId;
  name: string;
  description: string;
  icon: string;
};

export const MIGRATION_PLATFORMS: MigrationPlatformOption[] = [
  { id: "facebook_marketplace", name: "Facebook Marketplace", icon: "📘" },
  { id: "ebay", name: "eBay", icon: "🛒" },
  { id: "amazon", name: "Amazon", icon: "📦" },
  { id: "etsy", name: "Etsy", icon: "🧵" },
  { id: "vinted", name: "Vinted", icon: "👗" },
  { id: "depop", name: "Depop", icon: "👜" },
  { id: "shopify", name: "Shopify", icon: "🛍️" },
  { id: "woocommerce", name: "WooCommerce", icon: "🔌" },
  { id: "magento", name: "Magento", icon: "🧱" },
  { id: "bigcommerce", name: "BigCommerce", icon: "🏗️" },
  { id: "opencart", name: "OpenCart", icon: "🛒" },
  { id: "prestashop", name: "PrestaShop", icon: "⚙️" },
  { id: "wix_stores", name: "Wix Stores", icon: "🌐" },
  { id: "squarespace", name: "Squarespace", icon: "⬛" },
  { id: "gumtree", name: "Gumtree", icon: "🌳", region: "UK" },
  { id: "craigslist", name: "Craigslist", icon: "📰" },
  { id: "mercari", name: "Mercari", icon: "🇯🇵" },
  { id: "offerup", name: "OfferUp", icon: "📱" },
  { id: "olx", name: "OLX", icon: "🌍" },
  { id: "wallapop", name: "Wallapop", icon: "🇪🇸" },
  { id: "kleinanzeigen", name: "Kleinanzeigen", icon: "🇩🇪" },
  { id: "leboncoin", name: "Leboncoin", icon: "🇫🇷" },
  { id: "marktplaats", name: "Marktplaats", icon: "🇳🇱" },
  { id: "allegro", name: "Allegro", icon: "🇵🇱" },
  { id: "subito", name: "Subito", icon: "🇮🇹" },
  { id: "kijiji", name: "Kijiji", icon: "🍁" },
  { id: "csv", name: "CSV file", icon: "📄" },
  { id: "xlsx", name: "XLSX file", icon: "📊" },
  { id: "xml", name: "XML feed", icon: "🗂️" },
  { id: "other", name: "Many more…", icon: "✨" },
];

export const MIGRATION_IMPORT_METHODS: MigrationImportMethodOption[] = [
  {
    id: "single_url",
    name: "Single Listing",
    description: "Import one listing from a product page link.",
    icon: "🔗",
  },
  {
    id: "multiple_urls",
    name: "Multiple URLs",
    description: "Paste several listing URLs at once.",
    icon: "📋",
  },
  {
    id: "bulk_import",
    name: "Bulk Import",
    description: "Import a large batch without artificial limits.",
    icon: "📦",
  },
  {
    id: "store_import",
    name: "Entire Store",
    description: "Migrate your full storefront in one job.",
    icon: "🏪",
  },
  {
    id: "csv",
    name: "CSV",
    description: "Upload a comma-separated inventory file.",
    icon: "📄",
  },
  {
    id: "xlsx",
    name: "XLSX",
    description: "Upload an Excel spreadsheet export.",
    icon: "📊",
  },
  {
    id: "xml",
    name: "XML",
    description: "Import from an XML product feed.",
    icon: "🗂️",
  },
  {
    id: "api_import",
    name: "API Import",
    description: "Sync via marketplace API credentials.",
    icon: "⚡",
  },
];

export const MIGRATION_WIZARD_STEPS = [
  { step: 1 as const, label: "Platform" },
  { step: 2 as const, label: "Import method" },
  { step: 3 as const, label: "Preview" },
  { step: 4 as const, label: "Progress" },
  { step: 5 as const, label: "Report" },
];

export { CONNECTOR_PLATFORM_IDS as MIGRATION_PLATFORM_IDS };