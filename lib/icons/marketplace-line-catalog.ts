/**
 * ROVEXO v1.0 — Canonical Marketplace Line Icon Catalog (SSOT)
 *
 * ONE icon system for all menus / submenus / user pages
 * (Homepage, Login, Register excluded — frozen separately).
 *
 * Style freeze: classic · standard · minimalist · line · purple/white marketplace.
 * No 3D · no Fluency · no premium · no cartoon packs.
 */
import type { AccountIconName } from "@/components/account/AccountIcons";

export const MARKETPLACE_ICON_STROKE = 1.9 as const;
export const MARKETPLACE_ICON_VIEWBOX = "0 0 24 24" as const;
export const MARKETPLACE_ICON_SIZE_PX = 22 as const;

/** Every dedicated marketplace icon key (AccountIcon family). */
export const MARKETPLACE_ICON_CATALOG: ReadonlyArray<{
  key: AccountIconName;
  label: string;
  module: string;
}> = [
  { key: "search", label: "Search", module: "discovery" },
  { key: "saved", label: "Saved", module: "discovery" },
  { key: "sell", label: "Sell", module: "selling" },
  { key: "categories", label: "Categories", module: "discovery" },
  { key: "product", label: "Product details", module: "commerce" },
  { key: "checkout", label: "Checkout", module: "commerce" },
  { key: "cart", label: "Cart", module: "commerce" },
  { key: "orders", label: "Orders / Buyer", module: "buying" },
  { key: "tracking", label: "Tracking", module: "buying" },
  { key: "wallet", label: "Wallet", module: "wallet" },
  { key: "notifications", label: "Notifications", module: "inbox" },
  { key: "inbox", label: "Inbox", module: "inbox" },
  { key: "messages", label: "Messages / Transaction Hub", module: "inbox" },
  { key: "reviews", label: "Reviews", module: "trust" },
  { key: "settings", label: "Settings", module: "account" },
  { key: "help", label: "Help", module: "support" },
  { key: "support", label: "Support", module: "support" },
  { key: "trust", label: "Trust & Safety", module: "trust" },
  { key: "listings", label: "Listings / Seller", module: "selling" },
  { key: "business", label: "Business Dashboard", module: "business" },
  { key: "profile", label: "My Account / Profile", module: "account" },
  { key: "stores", label: "Stores", module: "business" },
  { key: "directory", label: "Directory", module: "business" },
  { key: "refunds", label: "Refunds", module: "resolution" },
  { key: "disputes", label: "Disputes", module: "resolution" },
  { key: "returns", label: "Returns", module: "selling" },
  { key: "shipping", label: "Shipping", module: "selling" },
  { key: "payment", label: "Payments", module: "wallet" },
  { key: "legal", label: "Legal", module: "legal" },
  { key: "verification", label: "Verification", module: "account" },
  { key: "security", label: "Security", module: "account" },
  { key: "inventory", label: "Inventory", module: "business" },
  { key: "analytics", label: "Analytics", module: "business" },
  { key: "vat", label: "VAT", module: "business" },
  { key: "recent", label: "Recently Viewed", module: "buying" },
  { key: "address", label: "Addresses", module: "settings" },
  { key: "language", label: "Language & Currency", module: "settings" },
  { key: "accessibility", label: "Accessibility", module: "settings" },
  { key: "ideas", label: "Rovexo Ideas", module: "settings" },
  { key: "promotions", label: "Promotions", module: "selling" },
  { key: "following", label: "Following / Connected", module: "social" },
  { key: "import", label: "Import / Bring item", module: "selling" },
];

export type MarketplaceIconKey = (typeof MARKETPLACE_ICON_CATALOG)[number]["key"];

export function listMarketplaceIconKeys(): AccountIconName[] {
  return MARKETPLACE_ICON_CATALOG.map((entry) => entry.key);
}
