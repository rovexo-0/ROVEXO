import type { MenuItemConfig } from "@/lib/platform-visual/types";

/** Canonical homepage bottom navigation — Browse · Sell · Inbox · Profile. */
export const HP_CANONICAL_BOTTOM_NAV: MenuItemConfig[] = [
  { id: "home", label: "Home", href: "/", icon: "home", enabled: true, order: 0 },
  { id: "search", label: "Browse", href: "/search", icon: "search", enabled: true, order: 1 },
  { id: "sell", label: "Sell", href: "/sell", icon: "sell", enabled: true, order: 2, featured: true },
  { id: "saved", label: "Inbox", href: "/inbox", icon: "messages", enabled: true, order: 3 },
  { id: "account", label: "Profile", href: "/account", icon: "account", enabled: true, order: 4 },
];
