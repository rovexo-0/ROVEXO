/**
 * Official My Account menu — fixed order per ROVEXO canonical UI reference v1.0.
 * One unified account; buyer and seller capabilities via the same menu.
 */
import type { AccountIconName } from "@/components/account/AccountIcons";

export type AccountMenuItem = {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
  icon: AccountIconName;
  badgeKeys?: Array<"messages" | "notifications">;
  showWalletBalance?: boolean;
  destructive?: boolean;
};

export const ACCOUNT_CANONICAL_MENU: readonly AccountMenuItem[] = [
  {
    id: "profile",
    title: "Profile",
    href: "/account/profile",
    icon: "profile",
  },
  {
    id: "listings",
    title: "My Listings",
    href: "/seller/listings",
    icon: "listings",
  },
  {
    id: "orders",
    title: "Orders",
    href: "/orders",
    icon: "orders",
  },
  {
    id: "saved",
    title: "Saved",
    href: "/saved",
    icon: "saved",
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
    id: "settings",
    title: "Settings",
    href: "/account/settings",
    icon: "settings",
  },
] as const;

export const ACCOUNT_LOGOUT_MENU_ITEM: AccountMenuItem = {
  id: "logout",
  title: "Log Out",
  icon: "security",
  destructive: true,
};
