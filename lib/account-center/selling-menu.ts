/**
 * Selling hub — Vinted Philosophy Freeze (PO Full Platform UI/UX Rebuild).
 * Few rows. High density. One Master Menu Design System.
 */
import type { AccountIconName } from "@/components/account/AccountIcons";
import { BRING_YOUR_ITEM_PATH } from "@/lib/bring-your-item/paths";
import { isBringYourItemEnabled } from "@/lib/bring-your-item/release";
import type { MobileBadgeKey } from "@/lib/mobile-ui/types";
import { MARKETPLACE_CONNECTORS_PATH } from "@/lib/seller/marketplace/config";

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
  const sections: SellingMenuSection[] = [
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
        {
          id: "compliance",
          title: "Compliance",
          subtitle: "Tax & reporting",
          href: "/seller/compliance",
          icon: "verification",
        },
      ],
    },
  ];

  if (isBringYourItemEnabled()) {
    sections.push({
      id: "import",
      title: "",
      items: [
        {
          id: "bring-your-item",
          title: "Bring Your Item",
          subtitle: "Import listings",
          href: BRING_YOUR_ITEM_PATH,
          icon: "listings",
        },
        {
          id: "connectors",
          title: "Connectors",
          subtitle: "Marketplace sources",
          href: MARKETPLACE_CONNECTORS_PATH,
          icon: "business",
        },
      ],
    });
  }

  return sections;
}
