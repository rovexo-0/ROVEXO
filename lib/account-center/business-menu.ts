/**
 * Business hub — Absolute Final Freeze (officially locked).
 * Orders · Inventory · Analytics · Reviews · Wallet · VAT · Directory.
 */
import type { AccountIconName } from "@/components/account/AccountIcons";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";

export type BusinessMenuItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: AccountIconName;
  badgeKeys?: MobileBadgeKey[];
};

export type BusinessMenuSection = {
  id: string;
  title: string;
  items: BusinessMenuItem[];
};

export const BUSINESS_HUB_INTRO = "Manage your business.";

export function buildBusinessMenuSections(_storeSlug?: string | null): BusinessMenuSection[] {
  void _storeSlug;
  return [
    {
      id: "business",
      title: "",
      items: [
        {
          id: "orders",
          title: "Orders",
          href: "/business/orders",
          icon: "orders",
          badgeKeys: ["orders"],
        },
        { id: "inventory", title: "Inventory", href: "/business/inventory", icon: "inventory" },
        { id: "analytics", title: "Analytics", href: "/business/analytics", icon: "analytics" },
        { id: "reviews", title: "Reviews", href: "/business/reviews", icon: "reviews" },
        {
          id: "wallet",
          title: "Wallet",
          href: "/business/wallet",
          icon: "wallet",
          badgeKeys: ["wallet-payout"],
        },
        { id: "vat", title: "VAT", href: "/business/tax", icon: "vat" },
        { id: "directory", title: "Directory", href: "/business/directory", icon: "directory" },
      ],
    },
  ];
}
