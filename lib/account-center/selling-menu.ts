/**
 * Selling hub — Master Menu Design (PO Final Authorization).
 */
import type { AccountIconName } from "@/components/account/AccountIcons";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";

export type SellingMenuItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: AccountIconName;
  badgeKeys?: MobileBadgeKey[];
};

export type SellingMenuSection = {
  id: string;
  title: string;
  items: SellingMenuItem[];
};

export function buildSellingMenuSections(): SellingMenuSection[] {
  return [
    {
      id: "selling",
      title: "",
      items: [
        { id: "listings", title: "Listings", href: "/seller/listings", icon: "listings" },
        {
          id: "orders",
          title: "Orders",
          href: "/seller/orders",
          icon: "orders",
          badgeKeys: ["orders"],
        },
        {
          id: "wallet",
          title: "Wallet",
          href: "/wallet",
          icon: "wallet",
          badgeKeys: ["wallet-payout"],
        },
        { id: "analytics", title: "Analytics", href: "/seller/analytics", icon: "business" },
        {
          id: "promotions",
          title: "Promotions",
          href: "/account/promotion-tools",
          icon: "promotions",
        },
        { id: "offers", title: "Offers", href: "/account/offers?role=seller", icon: "promotions" },
        { id: "reviews", title: "Review Center", href: "/seller/review-center", icon: "reviews" },
        { id: "returns", title: "Returns & Refunds", href: "/resolution", icon: "returns" },
      ],
    },
  ];
}
