/**
 * Selling hub — Vinted Philosophy Freeze (PO Full Platform UI/UX Rebuild).
 * Few rows. High density. One Master Menu Design System.
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

export const SELLING_HUB_INTRO = "Manage everything you sell.";

export function buildSellingMenuSections(): SellingMenuSection[] {
  return [
    {
      id: "selling",
      title: "",
      items: [
        {
          id: "listings",
          title: "Listings",
          href: "/seller/listings",
          icon: "listings",
        },
        {
          id: "orders",
          title: "Orders",
          href: "/seller/orders",
          icon: "orders",
          badgeKeys: ["orders"],
        },
        {
          id: "reviews",
          title: "Reviews",
          href: "/seller/review-center",
          icon: "reviews",
        },
        {
          id: "shipping",
          title: "Shipping",
          href: "/seller/shipping",
          icon: "shipping",
        },
        {
          id: "returns",
          title: "Returns",
          href: "/resolution",
          icon: "returns",
        },
        {
          id: "performance",
          title: "Performance",
          href: "/seller/performance",
          icon: "business",
        },
      ],
    },
  ];
}
