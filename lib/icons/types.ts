/**
 * ROVEXO 3D Glass Icon System — folder keys.
 */
export const ROVEXO_ICON_FOLDERS = [
  "categories",
  "navigation",
  "account",
  "settings",
  "orders",
  "payments",
  "shipping",
  "chat",
  "notifications",
  "search",
  "admin",
  "dashboard",
  "seller",
  "business",
  "badges",
  "status",
  "actions",
  "security",
  "support",
  "social",
  "analytics",
  "vehicles",
  "property",
  "electronics",
  "home",
  "fashion",
  "beauty",
  "pets",
  "sports",
  "music",
  "books",
  "travel",
  "tools",
  "files",
  "misc",
] as const;

export type RovexoIconFolder = (typeof ROVEXO_ICON_FOLDERS)[number];

export type RovexoIconKey =
  | "vehicles"
  | "property"
  | "phones"
  | "computers"
  | "electronics"
  | "gaming"
  | "home-garden"
  | "diy"
  | "tools"
  | "womens-fashion"
  | "mens-fashion"
  | "kids-fashion"
  | "shoes"
  | "jewellery"
  | "beauty"
  | "health"
  | "pets"
  | "sports"
  | "services"
  | "autoparts"
  | "home"
  | "search"
  | "sell"
  | "saved"
  | "account"
  | "heart"
  | "messages"
  | "bell"
  | "user"
  | "eye"
  | "star"
  | "wishlist"
  | "arrow-right"
  | "plus"
  | "verified"
  | "badge-check"
  | "settings"
  | "shield"
  | "logout"
  | "orders"
  | "cart"
  | "payment"
  | "shipping"
  | "business"
  | "listings"
  | "wallet"
  | "analytics"
  | "trust"
  | "help"
  | "support"
  | "inventory"
  | "wholesale"
  | "plans"
  | "addresses"
  | "auctions"
  | "resolution"
  | "categories"
  | "tax"
  | "admin"
  | "buy-hub"
  | "sell-hub"
  | "business-hub"
  | "support-hub";

export type RovexoIconRef = {
  folder: RovexoIconFolder;
  name: RovexoIconKey | string;
};
