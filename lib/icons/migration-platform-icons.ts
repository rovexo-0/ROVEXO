import { RovexoIcons } from "@/lib/icons/icons";
import type { MigrationPlatformId } from "@/lib/seller/migration/types";
import type { RovexoIconRef } from "@/lib/icons/types";

const MIGRATION_PLATFORM_ICONS: Record<MigrationPlatformId, RovexoIconRef> = {
  facebook_marketplace: RovexoIcons.dashboard.listings,
  ebay: RovexoIcons.orders.cart,
  amazon: RovexoIcons.dashboard.inventory,
  etsy: RovexoIcons.seller.listings,
  vinted: RovexoIcons.categories["womens-fashion"],
  depop: RovexoIcons.categories["mens-fashion"],
  shopify: RovexoIcons.business.business,
  woocommerce: RovexoIcons.dashboard.inventory,
  magento: RovexoIcons.dashboard.inventory,
  bigcommerce: RovexoIcons.business.business,
  opencart: RovexoIcons.orders.cart,
  prestashop: RovexoIcons.dashboard.settings,
  wix_stores: RovexoIcons.dashboard.categories,
  squarespace: RovexoIcons.dashboard.categories,
  gumtree: RovexoIcons.categories.services,
  craigslist: RovexoIcons.dashboard.listings,
  mercari: RovexoIcons.orders.cart,
  offerup: RovexoIcons.navigation.search,
  olx: RovexoIcons.navigation.search,
  wallapop: RovexoIcons.navigation.search,
  kleinanzeigen: RovexoIcons.navigation.search,
  leboncoin: RovexoIcons.navigation.search,
  marktplaats: RovexoIcons.navigation.search,
  allegro: RovexoIcons.navigation.search,
  subito: RovexoIcons.navigation.search,
  kijiji: RovexoIcons.navigation.search,
  csv: RovexoIcons.dashboard.listings,
  xlsx: RovexoIcons.analytics.analytics,
  xml: RovexoIcons.dashboard.listings,
  other: RovexoIcons.actions.plus,
};

export function resolveMigrationPlatformIcon(platformId: MigrationPlatformId): RovexoIconRef {
  return MIGRATION_PLATFORM_ICONS[platformId] ?? RovexoIcons.dashboard.listings;
}
