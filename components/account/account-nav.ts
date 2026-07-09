/**
 * ROVEXO v1.0 — My Account grid destinations (spec §GRID ORDER + §ICONS).
 *
 * Sixteen items in a fixed 4×4 order. Colours use the exact spec palette; each
 * tile renders the glyph in `color` on a pastel wash derived from it. Every href
 * points at an existing, live route — no routing changes.
 */

import type { AccountIconName } from "@/components/account/AccountIcons";

/** Precomputed pastel washes — avoids inline `color-mix()` compositor layers on Android. */
export type AccountTileAccent =
  | "blue"
  | "green"
  | "orange"
  | "purple"
  | "red"
  | "gray"
  | "slate";

export type AccountNavItem = {
  id: string;
  label: string;
  href: string;
  icon: AccountIconName;
  /** Accent colour (spec palette) applied to the glyph. */
  color: string;
  /** Static tile wash + glyph colour via `.acx-card__tile--{accent}`. */
  accent: AccountTileAccent;
};

// Spec palette — primary accent uses official ROVEXO purple
const PRIMARY = "#9333EA";
const ORANGE = "#F59E0B";
const PURPLE = "#7C3AED";
const RED = "#EF4444";
const GRAY = "#6B7280";

/** Simplified account menu — grouped essentials, no duplicate hubs. */
export const ACCOUNT_NAV_ITEMS: readonly AccountNavItem[] = [
  { id: "orders", label: "My Orders", href: "/orders", icon: "orders", color: PURPLE, accent: "purple" },
  { id: "saved", label: "Saved Items", href: "/saved", icon: "saved", color: RED, accent: "red" },
  { id: "listings", label: "My Listings", href: "/seller/listings", icon: "listings", color: PURPLE, accent: "purple" },
  { id: "messages", label: "Messages", href: "/messages", icon: "messages", color: PRIMARY, accent: "blue" },
  { id: "wallet", label: "Wallet", href: "/account/wallet", icon: "wallet", color: ORANGE, accent: "orange" },
  { id: "ideas", label: "ROVEXO Ideas", href: "/account/ideas", icon: "ideas", color: ORANGE, accent: "orange" },
  { id: "security", label: "Security", href: "/account/security", icon: "security", color: PRIMARY, accent: "blue" },
  { id: "settings", label: "Settings", href: "/account/settings", icon: "settings", color: GRAY, accent: "gray" },
  { id: "notifications", label: "Notifications", href: "/notifications", icon: "notifications", color: PRIMARY, accent: "blue" },
  { id: "help", label: "Help", href: "/help", icon: "help", color: PRIMARY, accent: "blue" },
  { id: "payment", label: "Payment Methods", href: "/account/payment-methods", icon: "payment", color: PRIMARY, accent: "blue" },
  { id: "returns", label: "Returns", href: "/orders?tab=returns", icon: "returns", color: RED, accent: "red" },
] as const;

/** Super Admin only — not part of the public 16-tile grid spec. */
export const SUPER_ADMIN_ACCOUNT_NAV_ITEM: AccountNavItem = {
  id: "super-admin",
  label: "Super Admin Command Center",
  href: "/super-admin",
  icon: "security",
  color: "#0F172A",
  accent: "slate",
};
