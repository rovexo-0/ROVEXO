import { RovexoIcons } from "@/lib/icons";
import type { SellerQuickAction, SellerSettingsLink } from "@/types/seller";

export const SELLER_DASHBOARD_MAX_WIDTH = 100;

export const SELLER_NEW_ORDER_STATUSES = new Set(["awaiting_payment", "awaiting_shipment"]);
export const SELLER_PROCESSING_ORDER_STATUSES = new Set(["awaiting_shipment"]);
export const SELLER_RETURN_ORDER_STATUSES = new Set(["issue_open"]);

export function buildSellerQuickActions(counts: {
  listings: number;
  orders: number;
  messages: number;
}): SellerQuickAction[] {
  return [
    {
      id: "add-listing",
      title: "Add Listing",
      href: "/sell/new",
      icon: RovexoIcons.navigation.sell,
    },
    {
      id: "boost",
      title: "Boost Listing",
      href: "/seller/listings",
      icon: RovexoIcons.actions.star,
      count: counts.listings,
    },
    {
      id: "wallet",
      title: "Wallet",
      href: "/wallet",
      icon: RovexoIcons.seller.wallet,
    },
    {
      id: "support",
      title: "Contact Support",
      href: "/support",
      icon: RovexoIcons.dashboard.support,
    },
    {
      id: "analytics",
      title: "View Analytics",
      href: "/seller/analytics",
      icon: RovexoIcons.seller.analytics,
      count: counts.orders,
    },
  ];
}

export const SELLER_SETTINGS_LINKS: SellerSettingsLink[] = [
  { id: "store", label: "Store", href: "/account/profile", icon: RovexoIcons.dashboard.listings },
  { id: "payments", label: "Wallet", href: "/wallet", icon: RovexoIcons.seller.wallet },
  { id: "notifications", label: "Notifications", href: "/notifications/settings", icon: RovexoIcons.notifications.bell },
  { id: "language", label: "Language", href: "/account/preferences/language", icon: RovexoIcons.dashboard.help },
  { id: "privacy", label: "Privacy", href: "/account/privacy", icon: RovexoIcons.security.shield },
];

export const SELLER_SUBSCRIPTION_PLACEHOLDER = {
  planLabel: "ROVEXO Seller",
  status: "active" as const,
  href: "/plans",
};
