/**
 * Buying hub — Absolute Final Freeze (officially locked).
 * My Orders · Tracking · Reviews · Refunds · Disputes · Saved · Recently Viewed.
 */
import type { AccountIconName } from "@/components/account/AccountIcons";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";

export type BuyingMenuItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  icon: AccountIconName;
  badgeKeys?: MobileBadgeKey[];
};

export type BuyingMenuSection = {
  id: string;
  title: string;
  items: BuyingMenuItem[];
};

export const BUYING_HUB_INTRO = "Manage everything you buy.";

export function buildBuyingMenuSections(): BuyingMenuSection[] {
  return [
    {
      id: "buying",
      title: "",
      items: [
        {
          id: "orders",
          title: "My Orders",
          href: "/orders?tab=bought",
          icon: "orders",
          badgeKeys: ["orders"],
        },
        {
          id: "tracking",
          title: "Tracking",
          href: "/orders?tab=bought&status=in_progress",
          icon: "shipping",
          badgeKeys: ["orders"],
        },
        { id: "reviews", title: "Reviews", href: "/account/reviews", icon: "reviews" },
        { id: "refunds", title: "Refunds", href: "/resolution?type=refund", icon: "returns" },
        { id: "disputes", title: "Disputes", href: "/resolution?type=dispute", icon: "returns" },
        {
          id: "saved",
          title: "Saved",
          href: "/saved",
          icon: "saved",
          badgeKeys: ["saved"],
        },
        {
          id: "recently-viewed",
          title: "Recently Viewed",
          href: "/account/recently-viewed",
          icon: "listings",
        },
      ],
    },
  ];
}
