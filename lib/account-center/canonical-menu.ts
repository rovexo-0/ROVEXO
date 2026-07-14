/**
 * ROVEXO My Account — canonical menu (final visual QA list).
 * Single account hub for every authenticated user.
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
  title?: string;
  items: AccountMenuItem[];
};

export const ACCOUNT_LOGOUT_MENU_ITEM: AccountMenuItem = {
  id: "logout",
  title: "Log Out",
  icon: "security",
  destructive: true,
};

/**
 * Classic account list — exact hub rows (no Promotion Tools / Help / Ideas).
 */
export function buildAccountMenuSections(profile: UserProfile): AccountMenuSection[] {
  void profile;
  return [
    {
      id: "primary",
      items: [
        { id: "listings", title: "My Listings", href: "/seller/listings", icon: "listings" },
        { id: "orders", title: "Orders", href: "/orders", icon: "orders", badgeKeys: ["orders"] },
        {
          id: "inbox",
          title: "Inbox",
          href: "/inbox",
          icon: "messages",
          badgeKeys: ["messages"],
        },
        { id: "wallet", title: "Wallet", href: "/wallet", icon: "wallet" },
        { id: "reviews", title: "Reviews", href: "/account/reviews", icon: "reviews" },
        { id: "saved", title: "Saved", href: "/saved", icon: "saved", badgeKeys: ["saved"] },
        { id: "following", title: "Following", href: "/account/followers", icon: "following" },
        { id: "settings", title: "Settings", href: "/account/settings", icon: "settings" },
      ],
    },
  ];
}

/** @deprecated Use buildAccountMenuSections — flat list for legacy callers. */
export function buildAccountMenu(profile: UserProfile): AccountMenuItem[] {
  return buildAccountMenuSections(profile).flatMap((section) => section.items);
}

/** @deprecated Selling submenu removed — unified account has no seller conversion menu. */
export function buildSellingSubmenu(profile: UserProfile): never[] {
  void profile;
  return [];
}
