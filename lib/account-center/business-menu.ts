/**
 * Business hub — Master Menu Design (PO Final Authorization).
 * Max 2 wallets platform-wide: Personal (/wallet) + Business (/business/wallet).
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

export function buildBusinessMenuSections(storeSlug?: string | null): BusinessMenuSection[] {
  const storeHref = storeSlug ? `/store/${storeSlug}` : "/business/dashboard";

  return [
    {
      id: "business",
      title: "",
      items: [
        { id: "store", title: "Store", href: storeHref, icon: "business" },
        {
          id: "orders",
          title: "Orders",
          href: "/business/orders",
          icon: "orders",
          badgeKeys: ["orders"],
        },
        {
          id: "wallet",
          title: "Wallet",
          href: "/business/wallet",
          icon: "wallet",
          badgeKeys: ["wallet-payout"],
        },
        { id: "analytics", title: "Analytics", href: "/business/analytics", icon: "business" },
        {
          id: "promotions",
          title: "Promotions",
          href: "/business/promotions",
          icon: "promotions",
        },
        { id: "followers", title: "Followers", href: "/account/followers", icon: "following" },
        { id: "reviews", title: "Reviews", href: "/business/reviews", icon: "reviews" },
        {
          id: "verification",
          title: "Verification",
          href: "/business/verification",
          icon: "verification",
        },
        { id: "policies", title: "Policies", href: "/business/policies", icon: "help" },
        { id: "returns", title: "Returns & Refunds", href: "/resolution", icon: "returns" },
      ],
    },
  ];
}
