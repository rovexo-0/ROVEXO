import { MIGRATION_CENTER_PATH } from "@/lib/seller/migration/config";
import { MARKETPLACE_CONNECTORS_PATH } from "@/lib/seller/marketplace/config";
import type { MobileBadgeKey, MobileTile } from "@/lib/mobile-ui/types";
import type { UserProfile } from "@/lib/profile/types";

export type AccountCenterModuleId = "buyer" | "seller" | "business" | "account";

export type AccountQuickAccessModule = {
  id: AccountCenterModuleId;
  href: string;
  title: string;
  subtitle: string;
  icon: "buyer" | "seller" | "business" | "account";
  badgeKeys?: MobileBadgeKey[];
};

export const ACCOUNT_QUICK_ACCESS: AccountQuickAccessModule[] = [
  {
    id: "buyer",
    href: "/buyer",
    title: "Buyer",
    subtitle: "Orders, saved & discovery",
    icon: "buyer",
    badgeKeys: ["orders", "cart", "messages", "notifications", "saved"],
  },
  {
    id: "seller",
    href: "/seller",
    title: "Seller",
    subtitle: "Listings, wallet & analytics",
    icon: "seller",
    badgeKeys: ["orders", "wallet-payout"],
  },
  {
    id: "business",
    href: "/business/center",
    title: "Business",
    subtitle: "B2B, wholesale & directory",
    icon: "business",
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

/** Buyer module — spec §10. */
export function getBuyerModuleTiles(): MobileTile[] {
  return [
    tile("/orders", "Orders", "Track purchases", "orders"),
    tile("/messages", "Messages", "Buyer & seller chats", "messages"),
    tile("/saved", "Saved", "Items you saved", "saved"),
    tile("/notifications", "Notifications", "Alerts & activity", "notifications"),
    tile("/support", "Support", "Help from our team"),
    tile("/trust", "Trust Centre", "Score, safety & verification"),
    tile("/resolution", "Resolution Centre", "Disputes, returns & claims"),
    tile("/plans", "Premium", "Subscriptions & buyer perks"),
    tile("/search", "Search", "Find anything"),
    tile("/categories", "Browse", "Explore the marketplace"),
    tile("/auctions", "Auctions", "Live bidding"),
    tile("/cart", "Cart", "Ready to checkout", "cart"),
  ];
}

/** Seller module — spec §11. */
export function getSellerModuleTiles(_profile: UserProfile): MobileTile[] {
  return [
    tile("/seller/listings", "Listings", "Manage inventory"),
    tile("/seller/orders", "Orders", "Fulfillment & shipping", "orders"),
    tile("/seller/wallet", "Wallet", "Balance & withdrawals", "wallet-payout"),
    tile("/seller/analytics", "Analytics", "Views, sales & trends"),
    tile("/sell", "Publish", "Create a listing"),
    tile(MARKETPLACE_CONNECTORS_PATH, "Marketplace Import", "Connect external stores"),
    tile(MIGRATION_CENTER_PATH, "Bring Your Item", "Import your store"),
    tile("/plans", "Promotions", "Boost & premium tools"),
    tile("/seller/tax", "Tax", "VAT & registration"),
    tile("/support", "Support", "Seller help"),
  ];
}

/** Business module — spec §12. */
export function getBusinessModuleTiles(profile: UserProfile): MobileTile[] {
  const tiles: MobileTile[] = [
    tile("/business/dashboard", "Company Dashboard", "Revenue & orders"),
    tile("/wholesale", "B2B", "Trade & bulk orders"),
    tile("/wholesale", "Wholesale", "MOQ & bulk pricing"),
    tile("/business/center", "Leads", "B2B opportunities"),
    tile("/orders", "Invoices", "Orders & receipts", "orders"),
    tile("/seller/tax", "VAT", "Tax & registration"),
    tile("/business/analytics", "Analytics", "Insights & reports"),
    tile("/business/directory", "Directory", "Verified companies"),
    tile("/account/settings", "Company Settings", "Access & permissions"),
  ];

  if (profile.username) {
    tiles.unshift(tile(`/store/${profile.username}`, "Business Profile", "Public store page"));
  }

  return tiles;
}

/** Account module — spec §13. */
export function getAccountModuleTiles(): MobileTile[] {
  return [
    tile("/account/profile", "Profile", "Name, avatar & email"),
    tile("/account/security", "Security", "Password, 2FA & sessions"),
    tile("/account/addresses", "Addresses", "Shipping & billing"),
    tile("/account/payment-methods", "Payment Methods", "Cards & checkout"),
    tile("/account/preferences/language", "Language", "Locale & region"),
    tile("/notifications/settings", "Notifications", "Push & email", "notifications"),
    tile("/account/preferences/appearance", "Appearance", "Theme & display"),
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
    case "buyer":
      return { title: "Buyer", backHref: "/account", backLabel: "My Account" };
    case "seller":
      return { title: "Seller", backHref: "/account", backLabel: "My Account" };
    case "business":
      return { title: "Business", backHref: "/account", backLabel: "My Account" };
    case "account":
      return { title: "Account", backHref: "/account", backLabel: "My Account" };
  }
}

export function getModuleTiles(id: AccountCenterModuleId, profile: UserProfile): MobileTile[] {
  switch (id) {
    case "buyer":
      return getBuyerModuleTiles();
    case "seller":
      return getSellerModuleTiles(profile);
    case "business":
      return getBusinessModuleTiles(profile);
    case "account":
      return getAccountModuleTiles();
  }
}
