/**
 * ROVEXO My Account — Master Menu v2.0 (PO Final Authorization)
 * Buying / Selling / Business hubs + Account + Support. No duplicate wallets/orders.
 */
import type { AccountIconName } from "@/components/account/AccountIcons";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";
import type { UserProfile } from "@/lib/profile/types";

export type AccountMenuItem = {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  icon: AccountIconName;
  badgeKeys?: MobileBadgeKey[];
  destructive?: boolean;
  comingSoon?: boolean;
  showVerifiedBadge?: boolean;
};

export type AccountMenuSection = {
  id: string;
  /** Empty = divider group with no section label (Vinted Compact Premium). */
  title: string;
  items: AccountMenuItem[];
};

export const ACCOUNT_LOGOUT_MENU_ITEM: AccountMenuItem = {
  id: "logout",
  title: "Sign Out",
  icon: "security",
  destructive: true,
};

export function buildAccountMenuSections(profile: UserProfile): AccountMenuSection[] {
  void profile;

  return [
    {
      id: "hubs",
      title: "",
      items: [
        { id: "buying", title: "Buying", href: "/account/buying", icon: "orders", badgeKeys: ["orders", "cart", "saved"] },
        { id: "selling", title: "Selling", href: "/seller", icon: "listings", badgeKeys: ["orders", "wallet-payout"] },
        { id: "business", title: "Business", href: "/business/dashboard", icon: "business" },
      ],
    },
    {
      id: "account",
      title: "",
      items: [
        { id: "wallet", title: "Wallet", href: "/wallet", icon: "wallet", badgeKeys: ["wallet-payout"] },
        {
          id: "messages",
          title: "Messages",
          href: "/inbox",
          icon: "messages",
          badgeKeys: ["messages"],
        },
        {
          id: "notifications",
          title: "Notifications",
          href: "/inbox?tab=notifications",
          icon: "notifications",
          badgeKeys: ["notifications"],
        },
        {
          id: "verification",
          title: "Verification",
          href: "/account/verification",
          icon: "verification",
        },
        { id: "settings", title: "Settings", href: "/account/settings", icon: "settings" },
      ],
    },
    {
      id: "support",
      title: "",
      items: [
        { id: "help", title: "Help Centre", href: "/help", icon: "help" },
        { id: "trust", title: "Trust Centre", href: "/trust", icon: "verification" },
        { id: "legal", title: "Legal Centre", href: "/legal", icon: "help" },
      ],
    },
  ];
}

/** @deprecated Use buildAccountMenuSections — flat list for legacy callers. */
export function buildAccountMenu(profile: UserProfile): AccountMenuItem[] {
  return buildAccountMenuSections(profile).flatMap((section) => section.items);
}

/** @deprecated Selling submenu lives on /seller via selling-menu.ts. */
export function buildSellingSubmenu(profile: UserProfile): never[] {
  void profile;
  return [];
}
