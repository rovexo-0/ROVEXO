/**
 * Buying hub — Master Menu Design (PO Final Authorization).
 * One Feature = One Entry Point.
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

export function buildBuyingMenuSections(): BuyingMenuSection[] {
  return [
    {
      id: "buying",
      title: "",
      items: [
        { id: "orders", title: "Orders", href: "/orders?tab=bought", icon: "orders", badgeKeys: ["orders"] },
        { id: "cart", title: "Cart", href: "/cart", icon: "cart", badgeKeys: ["cart"] },
        { id: "saved", title: "Saved", href: "/saved", icon: "saved", badgeKeys: ["saved"] },
        { id: "offers", title: "Offers", href: "/account/offers", icon: "promotions" },
        {
          id: "returns-refunds",
          title: "Returns & Refunds",
          href: "/resolution",
          icon: "returns",
        },
        { id: "reviews", title: "Reviews", href: "/account/reviews", icon: "reviews" },
      ],
    },
  ];
}
