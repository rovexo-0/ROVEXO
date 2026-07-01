"use client";

import { BottomNavIcon3D, type BottomNavIconType } from "@/components/icons/BottomNavIcon3D";
import { RovexoIcon } from "@/components/icons/RovexoIcon";
import { resolveDashboardGlassIcon } from "@/lib/icons/resolve";
import { cn } from "@/lib/cn";

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
  | "support-hub";

type DashboardIcon3DProps = {
  type: DashboardIconType;
  className?: string;
  size?: number;
};

const BOTTOM_NAV_TYPES = new Set<BottomNavIconType>(["home", "search", "sell", "saved", "account"]);

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
  if (href.startsWith("/account")) return "account";
  if (href === "/auctions") return "auctions";
  if (href === "/categories" || href.startsWith("/category") || href.startsWith("/browse")) return "categories";
  if (href.startsWith("/seller/tax")) return "tax";
  if (href.startsWith("/super-admin") || href.startsWith("/admin")) return "admin";
  if (href === "/saved") return "saved";
  if (href === "/search") return "search";
  return "help";
}

export function DashboardIcon3D({ type, className, size = 32 }: DashboardIcon3DProps) {
  if (BOTTOM_NAV_TYPES.has(type as BottomNavIconType)) {
    return (
      <BottomNavIcon3D
        type={type as BottomNavIconType}
        size="tab"
        className={cn("h-8 w-8", className)}
      />
    );
  }

  return (
    <RovexoIcon
      icon={resolveDashboardGlassIcon(type)}
      variant="dashboard"
      size={size !== 32 ? size : undefined}
      className={cn("shrink-0", className)}
    />
  );
}
