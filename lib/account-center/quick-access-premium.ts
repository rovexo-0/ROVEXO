/**
 * ROVEXO v1.0 — Account page premium Quick Access grid (spec §QUICK ACCESS).
 * Ten destinations, two columns, each with a realistic 3D icon. UI config only —
 * no backend or business logic. Hrefs map to existing, live routes.
 */

import type { AccountPremiumIconKey } from "@/lib/account-center/premium-icons";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";

export type AccountQuickAccessItem = {
  id: string;
  label: string;
  href: string;
  icon: AccountPremiumIconKey;
  badge?: MobileBadgeKey;
};

export const ACCOUNT_QUICK_ACCESS_PREMIUM: readonly AccountQuickAccessItem[] = [
  { id: "orders", label: "My Orders", href: "/orders", icon: "orders" },
  { id: "saved", label: "Saved Items", href: "/saved", icon: "saved" },
  { id: "listings", label: "My Listings", href: "/seller/listings", icon: "listings" },
  { id: "messages", label: "Messages", href: "/messages", icon: "messages" },
  { id: "wallet", label: "Wallet", href: "/account/wallet", icon: "wallet" },
  { id: "ideas", label: "ROVEXO Ideas", href: "/account/ideas", icon: "help" },
  { id: "settings", label: "Settings", href: "/account/settings", icon: "settings" },
  { id: "help", label: "Help", href: "/help", icon: "help" },
] as const;
