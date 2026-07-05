/**
 * ROVEXO v1.0 — My Account grid destinations (spec §GRID ORDER + §ICONS).
 *
 * Sixteen items in a fixed 4×4 order. Colours use the exact spec palette; each
 * tile renders the glyph in `color` on a pastel wash derived from it. Every href
 * points at an existing, live route — no routing changes.
 */

import type { AccountIconName } from "@/components/account/AccountIcons";

export type AccountNavItem = {
  id: string;
  label: string;
  href: string;
  icon: AccountIconName;
  /** Accent colour (spec palette) applied to the glyph + pastel tile. */
  color: string;
};

// Spec palette
const BLUE = "#2563EB";
const GREEN = "#22C55E";
const ORANGE = "#F59E0B";
const PURPLE = "#7C3AED";
const RED = "#EF4444";
const GRAY = "#6B7280";

export const ACCOUNT_NAV_ITEMS: readonly AccountNavItem[] = [
  { id: "orders", label: "My Orders", href: "/orders", icon: "orders", color: PURPLE },
  { id: "saved", label: "Saved Items", href: "/saved", icon: "saved", color: RED },
  { id: "listings", label: "My Listings", href: "/seller/listings", icon: "listings", color: PURPLE },
  { id: "messages", label: "Messages", href: "/messages", icon: "messages", color: BLUE },
  // Row 2
  { id: "wallet", label: "Wallet", href: "/account/wallet", icon: "wallet", color: ORANGE },
  { id: "business", label: "Business", href: "/business/dashboard", icon: "business", color: BLUE },
  { id: "settings", label: "Settings", href: "/account/settings", icon: "settings", color: GRAY },
  { id: "help", label: "Help", href: "/help", icon: "help", color: BLUE },
  // Row 3
  { id: "reviews", label: "Reviews", href: "/seller/review-center", icon: "reviews", color: ORANGE },
  { id: "shipping", label: "Shipping Labels", href: "/account/seller/shipping", icon: "shipping", color: GREEN },
  { id: "returns", label: "Returns", href: "/orders?tab=returns", icon: "returns", color: RED },
  { id: "notifications", label: "Notifications", href: "/notifications", icon: "notifications", color: BLUE },
  // Row 4
  { id: "security", label: "Security", href: "/account/security", icon: "security", color: BLUE },
  { id: "following", label: "Following", href: "/buyer", icon: "following", color: PURPLE },
  { id: "payment", label: "Payment Methods", href: "/account/payment-methods", icon: "payment", color: BLUE },
  { id: "support", label: "Support Center", href: "/support", icon: "support", color: GREEN },
] as const;

/** Super Admin only — not part of the public 16-tile grid spec. */
export const SUPER_ADMIN_ACCOUNT_NAV_ITEM: AccountNavItem = {
  id: "super-admin",
  label: "Super Admin Command Center",
  href: "/super-admin",
  icon: "security",
  color: "#0F172A",
};
