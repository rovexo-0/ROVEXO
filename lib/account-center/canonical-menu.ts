/**
 * Official My Account menu — ROVEXO Unified Account Architecture v2.1 (FINAL SSOT).
 * One ROVEXO account; capabilities expand Selling automatically.
 */
import type { AccountIconName } from "@/components/account/AccountIcons";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { isBringYourItemEnabled } from "@/lib/bring-your-item/release";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";
import type { UserProfile } from "@/lib/profile/types";

export type AccountMenuChild = {
  id: string;
  title: string;
  href: string;
};

export type AccountMenuItem = {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  icon: AccountIconName;
  badgeKeys?: MobileBadgeKey[];
  showWalletBalance?: boolean;
  destructive?: boolean;
  expandable?: boolean;
  children?: AccountMenuChild[];
  /** Disabled row with Coming Soon badge — shown when BYI is not yet certified for production. */
  comingSoon?: boolean;
};

export const ACCOUNT_LOGOUT_MENU_ITEM: AccountMenuItem = {
  id: "logout",
  title: "Log Out",
  icon: "security",
  destructive: true,
};

export function buildSellingSubmenu(profile: UserProfile): AccountMenuChild[] {
  const items: AccountMenuChild[] = [
    { id: "selling-dashboard", title: "Dashboard", href: "/seller" },
    { id: "selling-listings", title: "Listings", href: "/seller/listings" },
    { id: "selling-orders", title: "Orders", href: "/seller/orders" },
    { id: "selling-reviews", title: "Reviews", href: "/seller/review-center" },
  ];

  if (profile.capabilities.hasStore && profile.username) {
    items.push(
      { id: "selling-store", title: "Store", href: `/store/${profile.username}` },
      { id: "selling-analytics", title: "Analytics", href: "/seller/analytics" },
      { id: "selling-shipping", title: "Shipping", href: "/seller/orders" },
    );
  }

  if (profile.capabilities.hasBusinessVerification) {
    const businessProfileHref = profile.username
      ? `/store/${profile.username}`
      : "/account/profile";
    items.push(
      { id: "selling-business-profile", title: "Business Profile", href: businessProfileHref },
      { id: "selling-invoices", title: "Invoices", href: "/orders" },
      { id: "selling-tax", title: "Tax Settings", href: "/seller/tax" },
    );
  }

  return items;
}

export function buildAccountMenu(profile: UserProfile): AccountMenuItem[] {
  const bringYourItemEnabled = isBringYourItemEnabled();

  return [
    {
      id: "profile",
      title: "Profile",
      href: "/account/profile",
      icon: "profile",
    },
    {
      id: "selling",
      title: "Selling",
      icon: "listings",
      expandable: true,
      children: buildSellingSubmenu(profile),
    },
    {
      id: "orders",
      title: "Orders",
      href: "/orders",
      icon: "orders",
      badgeKeys: ["orders"],
    },
    {
      id: "cart",
      title: "Cart",
      href: "/cart",
      icon: "cart",
      badgeKeys: ["cart"],
    },
    {
      id: "saved",
      title: "Saved",
      href: "/saved",
      icon: "saved",
      badgeKeys: ["saved"],
    },
    {
      id: "messages",
      title: "Messages",
      href: "/messages",
      icon: "messages",
      badgeKeys: ["messages"],
    },
    {
      id: "notifications",
      title: "Notifications",
      href: "/notifications",
      icon: "notifications",
      badgeKeys: ["notifications"],
    },
    {
      id: "wallet",
      title: "Wallet",
      href: "/wallet",
      icon: "wallet",
      showWalletBalance: true,
    },
    {
      id: "verification",
      title: "Verification",
      href: "/account/verification",
      icon: "verification",
    },
    {
      id: "ideas",
      title: "ROVEXO Ideas",
      href: "/account/ideas",
      icon: "ideas",
    },
    ...(profile.capabilities.hasStore && profile.username
      ? [
          {
            id: "store",
            title: "Store",
            href: `/store/${profile.username}`,
            icon: "listings" as AccountIconName,
          },
        ]
      : []),
    {
      id: "bring-your-item",
      title: "Bring Your Item",
      subtitle: bringYourItemEnabled ? undefined : "Coming Soon",
      href: bringYourItemEnabled ? BRING_YOUR_ITEM_PATH : undefined,
      icon: "import",
      comingSoon: !bringYourItemEnabled,
    },
    {
      id: "settings",
      title: "Settings",
      href: "/account/settings",
      icon: "settings",
    },
  ];
}
