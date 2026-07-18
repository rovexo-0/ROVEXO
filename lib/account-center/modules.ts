/**
 * ROVEXO My Account modules — legacy tile helpers.
 * Buying/Selling hubs now use Master Menu SSOT (buying-menu / selling-menu).
 */
import type { MobileBadgeKey, MobileTile } from "@/lib/mobile-ui/types";
import { buildBuyingMenuSections } from "@/lib/account-center/buying-menu";
import { buildSellingMenuSections } from "@/lib/account-center/selling-menu";

export type AccountCenterModuleId = "buying" | "selling" | "account";

export type AccountQuickAccessModule = {
  id: AccountCenterModuleId;
  href: string;
  title: string;
  subtitle: string;
  icon: "buying" | "selling" | "account";
  badgeKeys?: MobileBadgeKey[];
};

export const ACCOUNT_QUICK_ACCESS: AccountQuickAccessModule[] = [
  {
    id: "buying",
    href: "/account/buying",
    title: "Buying",
    subtitle: "Orders, Tracking & Saved",
    icon: "buying",
    badgeKeys: ["orders", "cart", "messages", "notifications", "saved"],
  },
  {
    id: "selling",
    href: "/seller",
    title: "Selling",
    subtitle: "Listings, Orders & Performance",
    icon: "selling",
    badgeKeys: ["orders", "wallet-payout"],
  },
  {
    id: "account",
    href: "/account/settings",
    title: "Account",
    subtitle: "Profile, security & help",
    icon: "account",
  },
];

function tile(
  href: string,
  label: string,
  subtitle: string,
  badge?: MobileBadgeKey,
): MobileTile {
  return { href, label, subtitle, badge };
}

export function getBuyingModuleTiles(): MobileTile[] {
  return buildBuyingMenuSections()
    .flatMap((section) => section.items)
    .map((item) => tile(item.href, item.title, item.subtitle ?? "", item.badgeKeys?.[0]));
}

export function getSellingModuleTiles(): MobileTile[] {
  return buildSellingMenuSections()
    .flatMap((section) => section.items)
    .map((item) => tile(item.href, item.title, item.subtitle ?? "", item.badgeKeys?.[0]));
}

export function getAccountModuleTiles(): MobileTile[] {
  return [
    tile("/account/profile", "Profile", "Name, avatar & email"),
    tile("/account/security", "Security", "Password, 2FA & sessions"),
    tile("/account/addresses", "Addresses", "Shipping & billing"),
    tile("/wallet/payment-methods", "Payment Methods", "Cards & checkout"),
    tile("/account/preferences/language", "Language", "Locale & region"),
    tile("/notifications/settings", "Notifications", "Push & email", "notifications"),
    tile("/account/ideas", "ROVEXO Ideas", "Suggest improvements"),
    tile("/help", "Help", "Guides & troubleshooting"),
    tile("/account/privacy", "Privacy", "Visibility & marketing"),
  ];
}

export function getModuleMeta(id: AccountCenterModuleId): {
  title: string;
  backHref: string;
  backLabel: string;
} {
  switch (id) {
    case "buying":
      return { title: "Buying", backHref: "/account", backLabel: "My Account" };
    case "selling":
      return { title: "Selling", backHref: "/account", backLabel: "My Account" };
    case "account":
      return { title: "Account", backHref: "/account", backLabel: "My Account" };
  }
}

export function getModuleTiles(id: AccountCenterModuleId): MobileTile[] {
  switch (id) {
    case "buying":
      return getBuyingModuleTiles();
    case "selling":
      return getSellingModuleTiles();
    case "account":
      return getAccountModuleTiles();
  }
}
