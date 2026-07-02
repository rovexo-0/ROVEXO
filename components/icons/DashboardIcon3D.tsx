"use client";

import { Fluency3DIcon } from "@/components/icons/Fluency3DIcon";
import { cn } from "@/lib/cn";
import type { BottomNavIconType } from "@/components/icons/BottomNavIcon3D";

export type DashboardIconType =
  | BottomNavIconType
  | "orders"
  | "cart"
  | "messages"
  | "notifications"
  | "settings"
  | "listings"
  | "wallet"
  | "analytics"
  | "trust"
  | "help"
  | "support"
  | "business"
  | "inventory"
  | "wholesale"
  | "plans"
  | "security"
  | "addresses"
  | "payment"
  | "shipping"
  | "auctions"
  | "resolution"
  | "categories"
  | "tax"
  | "admin"
  | "buy-hub"
  | "sell-hub"
  | "business-hub"
  | "support-hub"
  | "feature-privacy"
  | "feature-language"
  | "feature-appearance"
  | "feature-currency";

type DashboardIcon3DProps = {
  type: DashboardIconType;
  className?: string;
  size?: number;
};

export function resolveDashboardIconType(href: string): DashboardIconType {
  if (href === "/orders" || href.startsWith("/orders")) return "orders";
  if (href === "/cart") return "cart";
  if (href.startsWith("/messages")) return "messages";
  if (href.startsWith("/notifications")) return "notifications";
  if (href.startsWith("/settings") || href.startsWith("/account/settings") || href === "/legal") return "settings";
  if (href.startsWith("/import") || href.startsWith("/seller/migration") || href.startsWith("/seller/connectors")) return "listings";
  if (href.startsWith("/seller/listings") || href.startsWith("/sell")) return "listings";
  if (href.startsWith("/seller/wallet") || href === "/plans") return "wallet";
  if (href.includes("analytics")) return "analytics";
  if (href.startsWith("/trust")) return "trust";
  if (href.startsWith("/resolution")) return "resolution";
  if (href.startsWith("/assistant") || href.startsWith("/help")) return "help";
  if (href.startsWith("/support")) return "support";
  if (href.startsWith("/business")) return "business";
  if (href.startsWith("/wholesale")) return "wholesale";
  if (href === "/account/addresses") return "addresses";
  if (href === "/account/payment-methods") return "payment";
  if (href === "/account/security") return "security";
  if (href === "/account/seller/shipping") return "shipping";
  if (href.startsWith("/account/profile")) return "account";
  if (href.startsWith("/account/privacy")) return "feature-privacy";
  if (href.startsWith("/account/preferences/language")) return "feature-language";
  if (href.startsWith("/account/preferences/appearance")) return "feature-appearance";
  if (href.startsWith("/account/preferences/currency")) return "feature-currency";
  if (href.startsWith("/account/preferences/timezone")) return "feature-language";
  if (href.startsWith("/account/buyer")) return "settings";
  if (href.startsWith("/account")) return "account";
  if (href === "/auctions") return "auctions";
  if (href === "/categories" || href.startsWith("/category") || href.startsWith("/browse")) return "categories";
  if (href.startsWith("/seller/tax")) return "tax";
  if (href.startsWith("/seller/promotions") || href.startsWith("/seller/coupons")) return "plans";
  if (href.startsWith("/seller/inventory")) return "inventory";
  if (href.startsWith("/seller/shipping")) return "shipping";
  if (href.startsWith("/seller/returns")) return "resolution";
  if (href.startsWith("/seller/reviews")) return "trust";
  if (href.startsWith("/seller/customers")) return "business";
  if (href.startsWith("/seller/performance") || href.startsWith("/seller/reports")) return "analytics";
  if (href.startsWith("/seller")) return "listings";
  if (href.startsWith("/super-admin") || href.startsWith("/admin")) return "admin";
  if (href === "/saved") return "saved";
  if (href === "/search") return "search";
  if (href === "/watchlist") return "saved";
  if (href.startsWith("/recent")) return "search";
  return "help";
}

export function DashboardIcon3D({ type, className, size = 32 }: DashboardIcon3DProps) {
  return <Fluency3DIcon icon={type} size={size} className={cn("shrink-0", className)} />;
}
