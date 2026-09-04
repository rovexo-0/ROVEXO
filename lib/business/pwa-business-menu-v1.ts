/**
 * PWA Business Menu — consumes the global platform emoji SSOT.
 * Stripe / ROVEXO logos remain brand marks, not menu icons.
 */

import { PLATFORM_EMOJI } from "@/lib/icons/platform-emoji-v1";

export const PWA_BUSINESS_MENU_ENGINE = "pwa-business-menu-v1" as const;

export type PwaBusinessMenuItem = {
  id: string;
  emoji: string;
  title: string;
  href?: string;
  comingSoon?: boolean;
  value?: string;
};

export const PWA_BUSINESS_MENU_ITEMS: readonly PwaBusinessMenuItem[] = [
  { id: "orders", emoji: PLATFORM_EMOJI.businessOrders, title: "Orders", href: "/business/orders" },
  { id: "inventory", emoji: PLATFORM_EMOJI.inventory, title: "Inventory", href: "/business/inventory" },
  { id: "analytics", emoji: PLATFORM_EMOJI.analytics, title: "Analytics", href: "/business/analytics" },
  { id: "wallet", emoji: PLATFORM_EMOJI.wallet, title: "Wallet", href: "/business/wallet" },
  { id: "vat", emoji: PLATFORM_EMOJI.vat, title: "VAT", href: "/business/tax" },
  { id: "store", emoji: PLATFORM_EMOJI.store, title: "Store", href: "/store" },
  {
    id: "promote",
    emoji: PLATFORM_EMOJI.megaphone,
    title: "Promote",
    comingSoon: true,
    value: "Coming Soon",
  },
] as const;

export const PWA_BUSINESS_QUICK_ACTIONS = [
  { id: "list", emoji: PLATFORM_EMOJI.listings, title: "List an item", href: "/sell" },
  { id: "orders", emoji: PLATFORM_EMOJI.businessOrders, title: "Manage orders", href: "/business/orders" },
  { id: "store", emoji: PLATFORM_EMOJI.store, title: "My Store", href: "/store" },
  { id: "insights", emoji: PLATFORM_EMOJI.analytics, title: "Insights", href: "/business/analytics" },
] as const;

/** Extra Business submenu / action emojis (same global SSOT). */
export const PWA_BUSINESS_ACTION_EMOJI = {
  dashboard: PLATFORM_EMOJI.dashboard,
  store: PLATFORM_EMOJI.store,
  listings: PLATFORM_EMOJI.listings,
  orders: PLATFORM_EMOJI.businessOrders,
  inventory: PLATFORM_EMOJI.inventory,
  analytics: PLATFORM_EMOJI.analytics,
  reviews: PLATFORM_EMOJI.businessReviews,
  wallet: PLATFORM_EMOJI.wallet,
  vat: PLATFORM_EMOJI.vat,
  directory: PLATFORM_EMOJI.directory,
  settings: PLATFORM_EMOJI.settings,
  verification: PLATFORM_EMOJI.verification,
  promote: PLATFORM_EMOJI.megaphone,
  switch: PLATFORM_EMOJI.switch,
  shipping: PLATFORM_EMOJI.listings,
  resolution: PLATFORM_EMOJI.resolution,
  available: PLATFORM_EMOJI.available,
  outOfStock: PLATFORM_EMOJI.outOfStock,
  totalInventory: PLATFORM_EMOJI.totalInventory,
  unitsSold: PLATFORM_EMOJI.unitsSold,
  lowStock: PLATFORM_EMOJI.lowStock,
  dateRange: PLATFORM_EMOJI.date,
  continue: PLATFORM_EMOJI.continue,
  addressLookup: PLATFORM_EMOJI.address,
  pending: PLATFORM_EMOJI.pending,
  processing: PLATFORM_EMOJI.processing,
  paid: PLATFORM_EMOJI.paid,
  info: PLATFORM_EMOJI.info,
} as const;

export function pwaBusinessMenuEmoji(id: string): string {
  const fromMenu = PWA_BUSINESS_MENU_ITEMS.find((item) => item.id === id);
  if (fromMenu) return fromMenu.emoji;
  if (id in PWA_BUSINESS_ACTION_EMOJI) {
    return PWA_BUSINESS_ACTION_EMOJI[id as keyof typeof PWA_BUSINESS_ACTION_EMOJI];
  }
  return "•";
}
