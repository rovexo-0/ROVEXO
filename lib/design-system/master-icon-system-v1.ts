/**
 * ROVEXO v1.0 — MASTER ICON SYSTEM
 * PROFILE PAGE = ONLY SOURCE OF TRUTH for size, stroke family, colour logic.
 * Sell / Category / Settings inherit this lock (UI only).
 */

import type { AccountIconName } from "@/components/account/AccountIcons";
import {
  PROFILE_ICON_COLORS,
  PROFILE_ICON_SIZE_PX,
  PROFILE_ICON_SYSTEM_NAME,
  PROFILE_ICON_SYSTEM_STATUS,
  PROFILE_ICON_SYSTEM_VERSION,
} from "@/lib/account-center/profile-icon-system-v1";

export const MASTER_ICON_SYSTEM_NAME = "ROVEXO MASTER ICON SYSTEM" as const;
export const MASTER_ICON_SYSTEM_VERSION = "1.0" as const;
export const MASTER_ICON_SYSTEM_STATUS = "LOCKED — inherits Profile Icon System" as const;

/** Locked size — identical to Profile. */
export const MASTER_ICON_SIZE_PX = PROFILE_ICON_SIZE_PX;

/** Stroke family rules — identical to Profile menu glyphs. */
export const MASTER_ICON_STROKE = {
  width: 1.9,
  viewBox: "0 0 24 24",
  fill: "none",
  linecap: "round",
  linejoin: "round",
} as const;

/**
 * Master accent palette — Profile colours + platform extensions.
 * No grey placeholders.
 */
export const MASTER_ICON_COLORS = {
  ...PROFILE_ICON_COLORS,
  purple: PROFILE_ICON_COLORS.settings,
  blue: PROFILE_ICON_COLORS.legal,
  cyan: PROFILE_ICON_COLORS.balance,
  orange: PROFILE_ICON_COLORS["my-orders"],
  green: PROFILE_ICON_COLORS["holiday-mode"],
  red: PROFILE_ICON_COLORS.help,
  pink: PROFILE_ICON_COLORS.favourites,
  gold: PROFILE_ICON_COLORS.ideas,
  magenta: PROFILE_ICON_COLORS.promote,
} as const;

export type MasterIconColorKey = keyof typeof MASTER_ICON_COLORS;

/** Sell field rows — Profile density coloured line icons. */
export const SELL_FIELD_ICONS = {
  category: { icon: "categories" as AccountIconName, color: MASTER_ICON_COLORS.purple },
  brand: { icon: "stores" as AccountIconName, color: MASTER_ICON_COLORS.cyan },
  condition: { icon: "trust" as AccountIconName, color: MASTER_ICON_COLORS.green },
  colour: { icon: "product" as AccountIconName, color: MASTER_ICON_COLORS.pink },
  colors: { icon: "product" as AccountIconName, color: MASTER_ICON_COLORS.pink },
  material: { icon: "listings" as AccountIconName, color: MASTER_ICON_COLORS.orange },
  size: { icon: "inventory" as AccountIconName, color: MASTER_ICON_COLORS.blue },
  storage: { icon: "inventory" as AccountIconName, color: MASTER_ICON_COLORS.cyan },
  ram: { icon: "analytics" as AccountIconName, color: MASTER_ICON_COLORS.purple },
  network: { icon: "support" as AccountIconName, color: MASTER_ICON_COLORS.blue },
  platform: { icon: "promotions", color: MASTER_ICON_COLORS.magenta },
  model: { icon: "product" as AccountIconName, color: MASTER_ICON_COLORS.orange },
  compatibility: { icon: "tracking" as AccountIconName, color: MASTER_ICON_COLORS.cyan },
  parcel: { icon: "shipping" as AccountIconName, color: MASTER_ICON_COLORS.orange },
  "parcel-size": { icon: "shipping" as AccountIconName, color: MASTER_ICON_COLORS.orange },
  price: { icon: "wallet" as AccountIconName, color: MASTER_ICON_COLORS.cyan },
  seasonRating: { icon: "promotions" as AccountIconName, color: MASTER_ICON_COLORS.green },
  length: { icon: "inventory" as AccountIconName, color: MASTER_ICON_COLORS.blue },
  battery: { icon: "analytics" as AccountIconName, color: MASTER_ICON_COLORS.gold },
} as const;

export type SellFieldIconId = keyof typeof SELL_FIELD_ICONS;

/**
 * Category / taxonomy root icons — same Account line family as Profile/Settings.
 * Colours cycle Profile accents (never grey).
 */
export const CATEGORY_SLUG_ICONS: Record<
  string,
  { icon: AccountIconName; color: string }
> = {
  camping: { icon: "shipping", color: MASTER_ICON_COLORS.green },
  baby: { icon: "following", color: MASTER_ICON_COLORS.pink },
  maternity: { icon: "following", color: MASTER_ICON_COLORS.magenta },
  "mens-fashion": { icon: "listings", color: MASTER_ICON_COLORS.purple },
  "womens-fashion": { icon: "listings", color: MASTER_ICON_COLORS.pink },
  "kids-fashion": { icon: "listings", color: MASTER_ICON_COLORS.gold },
  fashion: { icon: "listings", color: MASTER_ICON_COLORS.purple },
  vehicles: { icon: "tracking", color: MASTER_ICON_COLORS.orange },
  property: { icon: "address", color: MASTER_ICON_COLORS.blue },
  phones: { icon: "support", color: MASTER_ICON_COLORS.cyan },
  computers: { icon: "analytics", color: MASTER_ICON_COLORS.purple },
  electronics: { icon: "product", color: MASTER_ICON_COLORS.blue },
  gaming: { icon: "promotions", color: MASTER_ICON_COLORS.magenta },
  sports: { icon: "reviews", color: MASTER_ICON_COLORS.orange },
  beauty: { icon: "saved", color: MASTER_ICON_COLORS.pink },
  shoes: { icon: "product", color: MASTER_ICON_COLORS.orange },
  jewellery: { icon: "promotions", color: MASTER_ICON_COLORS.gold },
  health: { icon: "help", color: MASTER_ICON_COLORS.red },
  pets: { icon: "following", color: MASTER_ICON_COLORS.green },
  diy: { icon: "settings", color: MASTER_ICON_COLORS.orange },
  tools: { icon: "settings", color: MASTER_ICON_COLORS.cyan },
  "home-garden": { icon: "stores", color: MASTER_ICON_COLORS.green },
  autoparts: { icon: "tracking", color: MASTER_ICON_COLORS.orange },
  books: { icon: "legal", color: MASTER_ICON_COLORS.blue },
  music: { icon: "promotions", color: MASTER_ICON_COLORS.purple },
  movies: { icon: "product", color: MASTER_ICON_COLORS.magenta },
  services: { icon: "business", color: MASTER_ICON_COLORS.blue },
  jobs: { icon: "business", color: MASTER_ICON_COLORS.cyan },
  food: { icon: "cart", color: MASTER_ICON_COLORS.orange },
  travel: { icon: "shipping", color: MASTER_ICON_COLORS.blue },
  events: { icon: "promotions", color: MASTER_ICON_COLORS.magenta },
  fishing: { icon: "shipping", color: MASTER_ICON_COLORS.cyan },
  antiques: { icon: "legal", color: MASTER_ICON_COLORS.gold },
  bags: { icon: "cart", color: MASTER_ICON_COLORS.pink },
  wedding: { icon: "saved", color: MASTER_ICON_COLORS.pink },
  appliances: { icon: "product", color: MASTER_ICON_COLORS.cyan },
};

const DEFAULT_CATEGORY_ICON = {
  icon: "categories" as AccountIconName,
  color: MASTER_ICON_COLORS.purple,
};

export function resolveCategoryMasterIcon(slug: string): {
  icon: AccountIconName;
  color: string;
} {
  return CATEGORY_SLUG_ICONS[slug] ?? DEFAULT_CATEGORY_ICON;
}

export function resolveSellFieldMasterIcon(fieldId: string): {
  icon: AccountIconName;
  color: string;
} | null {
  const key = fieldId.toLowerCase().replace(/\s+/g, "-") as SellFieldIconId;
  const mapped = SELL_FIELD_ICONS[key as SellFieldIconId];
  if (mapped) return mapped;
  // Attribute engine ids (e.g. seasonRating)
  if (fieldId in SELL_FIELD_ICONS) {
    return SELL_FIELD_ICONS[fieldId as SellFieldIconId];
  }
  return { icon: "categories", color: MASTER_ICON_COLORS.purple };
}

/** Hub menu rows (Buying / Selling / Business) — Profile accent by glyph. */
const HUB_MENU_ICON_COLORS: Partial<Record<AccountIconName, string>> = {
  orders: MASTER_ICON_COLORS.orange,
  tracking: MASTER_ICON_COLORS.cyan,
  reviews: MASTER_ICON_COLORS.gold,
  refunds: MASTER_ICON_COLORS.red,
  disputes: MASTER_ICON_COLORS.red,
  saved: MASTER_ICON_COLORS.pink,
  recent: MASTER_ICON_COLORS.purple,
  listings: MASTER_ICON_COLORS.purple,
  inventory: MASTER_ICON_COLORS.cyan,
  analytics: MASTER_ICON_COLORS.purple,
  promotions: MASTER_ICON_COLORS.magenta,
  shipping: MASTER_ICON_COLORS.orange,
  wallet: MASTER_ICON_COLORS.cyan,
  business: MASTER_ICON_COLORS.blue,
  stores: MASTER_ICON_COLORS.cyan,
  verification: MASTER_ICON_COLORS.green,
  settings: MASTER_ICON_COLORS.purple,
  help: MASTER_ICON_COLORS.red,
  support: MASTER_ICON_COLORS.red,
  legal: MASTER_ICON_COLORS.blue,
  messages: MASTER_ICON_COLORS.blue,
  payment: MASTER_ICON_COLORS.cyan,
  product: MASTER_ICON_COLORS.orange,
  import: MASTER_ICON_COLORS.purple,
  trust: MASTER_ICON_COLORS.green,
  following: MASTER_ICON_COLORS.pink,
  address: MASTER_ICON_COLORS.blue,
  cart: MASTER_ICON_COLORS.orange,
  profile: MASTER_ICON_COLORS.purple,
  security: MASTER_ICON_COLORS.red,
  returns: MASTER_ICON_COLORS.orange,
};

export function resolveHubMenuIconColor(icon: AccountIconName): string {
  return HUB_MENU_ICON_COLORS[icon] ?? MASTER_ICON_COLORS.purple;
}

export function masterIconSystemSnapshot() {
  return {
    name: MASTER_ICON_SYSTEM_NAME,
    version: MASTER_ICON_SYSTEM_VERSION,
    status: MASTER_ICON_SYSTEM_STATUS,
    inherits: {
      name: PROFILE_ICON_SYSTEM_NAME,
      version: PROFILE_ICON_SYSTEM_VERSION,
      status: PROFILE_ICON_SYSTEM_STATUS,
    },
    sizePx: MASTER_ICON_SIZE_PX,
    stroke: MASTER_ICON_STROKE,
    colors: MASTER_ICON_COLORS,
    forbidden: [
      "grey placeholders",
      "emojis",
      "mixed icon families",
      "custom row heights",
      "custom arrows",
    ] as const,
  } as const;
}
