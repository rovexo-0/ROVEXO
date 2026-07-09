import { MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import { MARKETPLACE_CONNECTORS_PATH } from "@/lib/seller/marketplace/config";
import { filterBringYourItemTiles } from "@/lib/bring-your-item/release";
import type { MobileBadgeKey, MobileTile } from "@/lib/mobile-ui/types";

export type AccountCenterModuleId = "buying" | "selling" | "account";

export type AccountQuickAccessModule = {
  id: AccountCenterModuleId;
  href: string;
  title: string;
  subtitle: string;
  icon: "buying" | "selling" | "account";
  badgeKeys?: MobileBadgeKey[];
};

export const ACCOUNT_QUICK_ACCESS: AccountQuickAccessModule[] = [
  {
    id: "buying",
    href: "/orders",
    title: "Buying",
    subtitle: "Orders, saved & discovery",
    icon: "buying",
    badgeKeys: ["orders", "cart", "messages", "notifications", "saved"],
  },
  {
    id: "selling",
    href: "/seller",
    title: "Selling",
    subtitle: "Listings, wallet & analytics",
    icon: "selling",
    badgeKeys: ["orders", "wallet-payout"],
  },
  {
    id: "account",
    href: "/account/settings",
    title: "Account",
    subtitle: "Profile, security & help",
    icon: "account",
  },
];

function tile(
  href: string,
  label: string,
  subtitle: string,
  badge?: MobileBadgeKey,
): MobileTile {
  return { href, label, subtitle, badge };
}

export function getBuyingModuleTiles(): MobileTile[] {
  return [
    tile("/orders", "Orders", "Track purchases", "orders"),
    tile("/messages", "Messages", "Marketplace chats", "messages"),
    tile("/saved", "Saved", "Items you saved", "saved"),
    tile("/notifications", "Notifications", "Alerts & activity", "notifications"),
    tile("/support", "Support", "Help from our team"),
    tile("/trust", "Trust Centre", "Score, safety & verification"),
    tile("/resolution", "Resolution Centre", "Disputes, returns & claims"),
    tile("/plans", "Premium", "Subscriptions & perks"),
    tile("/search", "Search", "Find anything"),
    tile("/categories", "Browse", "Explore the marketplace"),
    tile("/auctions", "Auctions", "Live bidding"),
    tile("/cart", "Cart", "Ready to checkout", "cart"),
  ];
}

export function getSellingModuleTiles(): MobileTile[] {
  return filterBringYourItemTiles([
    tile("/seller/listings", "Listings", "Manage inventory"),
    tile("/seller/orders", "Orders", "Fulfillment & shipping", "orders"),
    tile("/wallet", "Wallet", "Balance & payouts", "wallet-payout"),
    tile("/seller/analytics", "Analytics", "Views, sales & trends"),
    tile("/sell", "Publish", "Create a listing"),
    tile(MARKETPLACE_CONNECTORS_PATH, "Marketplace Import", "Connect external stores"),
    tile(MIGRATION_CENTER_PATH, "Bring Your Item", "Import your store"),
    tile("/plans", "Promotions", "Boost & premium tools"),
    tile("/seller/tax", "Tax", "VAT & registration"),
    tile("/support", "Support", "Selling help"),
  ]);
}

export function getAccountModuleTiles(): MobileTile[] {
  return [
    tile("/account/profile", "Profile", "Name, avatar & email"),
    tile("/account/security", "Security", "Password, 2FA & sessions"),
    tile("/account/addresses", "Addresses", "Shipping & billing"),
    tile("/account/payment-methods", "Payment Methods", "Cards & checkout"),
    tile("/account/preferences/language", "Language", "Locale & region"),
    tile("/notifications/settings", "Notifications", "Push & email", "notifications"),
    tile("/account/preferences/appearance", "Appearance", "Theme & display"),
    tile("/account/ideas", "ROVEXO Ideas", "Suggest improvements"),
    tile("/help", "Help", "Guides & troubleshooting"),
    tile("/account/privacy", "Privacy", "Visibility & marketing"),
  ];
}

export function getModuleMeta(id: AccountCenterModuleId): {
  title: string;
  backHref: string;
  backLabel: string;
} {
  switch (id) {
    case "buying":
      return { title: "Buying", backHref: "/account", backLabel: "My Account" };
    case "selling":
      return { title: "Selling", backHref: "/account", backLabel: "My Account" };
    case "account":
      return { title: "Account", backHref: "/account", backLabel: "My Account" };
  }
}

export function getModuleTiles(id: AccountCenterModuleId): MobileTile[] {
  switch (id) {
    case "buying":
      return getBuyingModuleTiles();
    case "selling":
      return getSellingModuleTiles();
    case "account":
      return getAccountModuleTiles();
  }
}
