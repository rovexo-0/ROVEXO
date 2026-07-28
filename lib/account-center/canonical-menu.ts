/**
 * ROVEXO Profile (Main) — Master Menu
 * Master Engine lock: Holiday Mode + Promote on Profile (not Settings).
 * Local → SHOW EVERYTHING. Production → smart visibility after activateProductionRules().
 */
import type { AccountIconName } from "@/components/account/AccountIcons";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";
import type { UserProfile } from "@/lib/profile/types";
import {
  resolveHolidayModeVisibility,
  resolvePromoteVisibility,
} from "@/lib/master-engine";

export type AccountMenuItem = {
  id: string;
  title: string;
  subtitle?: string;
  /** Trailing value (e.g. Available balance on Balance row). */
  value?: string;
  href?: string;
  icon: AccountIconName;
  badgeKeys?: MobileBadgeKey[];
  destructive?: boolean;
  comingSoon?: boolean;
  showVerifiedBadge?: boolean;
};

export type AccountMenuSection = {
  id: string;
  /** Empty = divider group with no section label. */
  title: string;
  items: AccountMenuItem[];
};

export const ACCOUNT_LOGOUT_MENU_ITEM: AccountMenuItem = {
  id: "logout",
  title: "Sign Out",
  icon: "security",
  destructive: true,
};

/**
 * Profile main menu — Favourites · Balance · Orders · Holiday · Promote ·
 * Settings · Rovexo Ideas · Help · Legal.
 * Sign Out is rendered by AccountMenuSections (not Settings).
 */
export function buildAccountMenuSections(
  profile: UserProfile,
  options?: {
    availableBalanceLabel?: string;
    activeListingCount?: number;
    isBusinessVerified?: boolean;
  },
): AccountMenuSection[] {
  void profile;
  void options?.isBusinessVerified;
  const listingCtx = { activeListingCount: options?.activeListingCount ?? 0 };
  const showHoliday = resolveHolidayModeVisibility(listingCtx).visible;
  const showPromote = resolvePromoteVisibility(listingCtx).visible;

  const items: AccountMenuItem[] = [
    {
      id: "favourites",
      title: "Favourites",
      href: "/saved",
      icon: "saved",
      badgeKeys: ["saved"],
    },
    {
      id: "balance",
      title: "Balance",
      href: "/balance",
      icon: "wallet",
      badgeKeys: ["wallet-payout"],
      value: options?.availableBalanceLabel,
    },
    {
      id: "my-orders",
      title: "My Orders",
      href: "/orders",
      icon: "orders",
      badgeKeys: ["orders"],
    },
  ];

  if (showHoliday) {
    items.push({
      id: "holiday-mode",
      title: "Holiday Mode",
      icon: "listings",
    });
  }

  if (showPromote) {
    items.push({
      id: "promote",
      title: "Promote",
      href: "/promote",
      icon: "promotions",
    });
  }

  items.push(
    {
      id: "settings",
      title: "Settings",
      href: "/settings",
      icon: "settings",
    },
    {
      id: "ideas",
      title: "Rovexo Ideas",
      href: "/account/ideas",
      icon: "ideas",
    },
    {
      id: "help",
      title: "Help Centre",
      href: "/help",
      icon: "help",
    },
    {
      id: "legal",
      title: "Legal Information",
      href: "/legal",
      icon: "legal",
    },
  );

  return [
    {
      id: "primary",
      title: "",
      items,
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
