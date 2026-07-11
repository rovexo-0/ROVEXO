/**
 * ROVEXO My Account — canonical menu v2.0 lock (Module 02).
 * Single source of truth. Pixel reference: Module 02 UI Lock v1.0.
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
      id: "manage",
      title: "MANAGE",
      items: [
        { id: "listings", title: "My Listings", href: "/seller/listings", icon: "listings" },
        { id: "orders", title: "Orders", href: "/orders", icon: "orders", badgeKeys: ["orders"] },
        { id: "saved", title: "Saved Items", href: "/saved", icon: "saved", badgeKeys: ["saved"] },
        { id: "reviews", title: "My Reviews", href: "/account/reviews", icon: "reviews" },
        { id: "wallet", title: "Wallet", href: "/wallet", icon: "wallet" },
      ],
    },
    {
      id: "account",
      title: "ACCOUNT",
      items: [{ id: "settings", title: "Settings", href: "/account/settings", icon: "settings" }],
    },
    {
      id: "support",
      title: "SUPPORT",
      items: [
        { id: "help", title: "Help Centre", href: "/help", icon: "help" },
        { id: "ideas", title: "Ideas", href: "/account/ideas", icon: "ideas" },
      ],
    },
  ];
}

/** @deprecated Use buildAccountMenuSections — flat list for legacy callers. */
export function buildAccountMenu(profile: UserProfile): AccountMenuItem[] {
  return buildAccountMenuSections(profile).flatMap((section) => section.items);
}

/** @deprecated Selling submenu removed in Module 02 canonical hub. */
export function buildSellingSubmenu(profile: UserProfile): never[] {
  void profile;
  return [];
}
