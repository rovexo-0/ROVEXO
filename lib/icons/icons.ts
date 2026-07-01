import type { RovexoCategoryPremiumKey } from "@/lib/home/category-premium-library";
import {
  getCategoryPremiumAssetPath,
  isRovexoCategoryPremiumKey,
} from "@/lib/home/category-premium-library";
import { IconTheme, type IconThemeMode } from "@/lib/icons/theme";
import type { RovexoIconFolder, RovexoIconKey, RovexoIconRef } from "@/lib/icons/types";

function icon(folder: RovexoIconFolder, name: string): RovexoIconRef {
  return { folder, name };
}

/** Central registry — import icons ONLY from here. */
export const RovexoIcons = {
  categories: {
    vehicles: icon("categories", "vehicles"),
    property: icon("categories", "property"),
    phones: icon("categories", "phones"),
    computers: icon("categories", "computers"),
    electronics: icon("categories", "electronics"),
    gaming: icon("categories", "gaming"),
    "home-garden": icon("categories", "home-garden"),
    diy: icon("categories", "diy"),
    tools: icon("categories", "tools"),
    "womens-fashion": icon("categories", "womens-fashion"),
    "mens-fashion": icon("categories", "mens-fashion"),
    "kids-fashion": icon("categories", "kids-fashion"),
    shoes: icon("categories", "shoes"),
    jewellery: icon("categories", "jewellery"),
    beauty: icon("categories", "beauty"),
    health: icon("categories", "health"),
    pets: icon("categories", "pets"),
    sports: icon("categories", "sports"),
    services: icon("categories", "services"),
    autoparts: icon("categories", "autoparts"),
  },
  navigation: {
    home: icon("navigation", "home"),
    search: icon("navigation", "search"),
    sell: icon("navigation", "sell"),
    saved: icon("navigation", "saved"),
    account: icon("navigation", "account"),
    heart: icon("navigation", "heart"),
  },
  chat: { messages: icon("chat", "messages") },
  notifications: { bell: icon("notifications", "bell") },
  account: { user: icon("account", "user") },
  search: { search: icon("search", "search") },
  actions: {
    eye: icon("actions", "eye"),
    star: icon("actions", "star"),
    heart: icon("actions", "heart"),
    wishlist: icon("actions", "wishlist"),
    "arrow-right": icon("actions", "arrow-right"),
    plus: icon("actions", "plus"),
  },
  badges: {
    verified: icon("badges", "verified"),
    "badge-check": icon("badges", "badge-check"),
  },
  settings: { settings: icon("settings", "settings") },
  security: {
    shield: icon("security", "shield"),
    logout: icon("security", "logout"),
  },
  orders: {
    orders: icon("orders", "orders"),
    cart: icon("orders", "cart"),
  },
  payments: { payment: icon("payments", "payment") },
  shipping: { shipping: icon("shipping", "shipping") },
  business: { business: icon("business", "business") },
  dashboard: {
    listings: icon("dashboard", "listings"),
    wallet: icon("dashboard", "wallet"),
    analytics: icon("dashboard", "analytics"),
    trust: icon("dashboard", "trust"),
    help: icon("dashboard", "help"),
    support: icon("dashboard", "support"),
    inventory: icon("dashboard", "inventory"),
    wholesale: icon("dashboard", "wholesale"),
    plans: icon("dashboard", "plans"),
    addresses: icon("dashboard", "addresses"),
    auctions: icon("dashboard", "auctions"),
    resolution: icon("dashboard", "resolution"),
    categories: icon("dashboard", "categories"),
    tax: icon("dashboard", "tax"),
    admin: icon("dashboard", "admin"),
    messages: icon("dashboard", "messages"),
    notifications: icon("dashboard", "notifications"),
    settings: icon("dashboard", "settings"),
    orders: icon("dashboard", "orders"),
    cart: icon("dashboard", "cart"),
    payment: icon("dashboard", "payment"),
    shipping: icon("dashboard", "shipping"),
    business: icon("dashboard", "business"),
    "buy-hub": icon("dashboard", "buy-hub"),
    "sell-hub": icon("dashboard", "sell-hub"),
    "business-hub": icon("dashboard", "business-hub"),
    "support-hub": icon("dashboard", "support-hub"),
  },
  analytics: { analytics: icon("analytics", "analytics") },
  support: { support: icon("support", "support") },
  admin: { admin: icon("admin", "admin") },
  seller: {
    listings: icon("seller", "listings"),
    wallet: icon("seller", "wallet"),
    analytics: icon("seller", "analytics"),
  },
  status: { verified: icon("status", "verified") },
  misc: { help: icon("misc", "help") },
} as const;

export function getRovexoIconPath(ref: RovexoIconRef): string {
  return `/icons/${ref.folder}/${ref.name}.svg`;
}

export function resolveRovexoIconSrc(
  ref: RovexoIconRef,
  mode: IconThemeMode = IconTheme.mode,
): string {
  if (mode === "standard" && ref.folder === "categories" && isRovexoCategoryPremiumKey(ref.name)) {
    return getCategoryPremiumAssetPath(ref.name as RovexoCategoryPremiumKey);
  }
  return getRovexoIconPath(ref);
}

export function getCategoryGlassIcon(key: string): RovexoIconRef {
  const categories = RovexoIcons.categories;
  if (key in categories) {
    return categories[key as RovexoCategoryPremiumKey];
  }
  return categories.electronics;
}

export function getRovexoIconByKey(key: RovexoIconKey): RovexoIconRef {
  for (const group of Object.values(RovexoIcons)) {
    if (key in group) {
      return group[key as keyof typeof group] as RovexoIconRef;
    }
  }
  return RovexoIcons.misc.help;
}
