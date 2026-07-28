"use client";

import { AccountIcon, type AccountIconName } from "@/components/account/AccountIcons";
import { cn } from "@/lib/cn";
import {
  resolveDashboardIconType,
  type DashboardIconType,
} from "@/lib/icons/resolve-dashboard-icon-type";

export type { DashboardIconType };
export { resolveDashboardIconType };

type DashboardIcon3DProps = {
  type: DashboardIconType;
  className?: string;
  size?: number;
};

const MAP: Record<string, AccountIconName> = {
  home: "profile",
  search: "search",
  sell: "sell",
  saved: "saved",
  account: "profile",
  notifications: "notifications",
  settings: "settings",
  categories: "categories",
  messages: "messages",
  wallet: "wallet",
  orders: "orders",
  cart: "cart",
  "buy-hub": "orders",
  "sell-hub": "sell",
  "business-hub": "business",
  "support-hub": "support",
  listings: "listings",
  business: "business",
  help: "help",
  support: "support",
  inventory: "inventory",
  product: "product",
  checkout: "checkout",
  tracking: "tracking",
  refunds: "refunds",
  disputes: "disputes",
  shipping: "shipping",
  trust: "trust",
  legal: "legal",
  directory: "directory",
  stores: "stores",
};
/** Absolute Final: line icons only — no Fluency 3D / dashboard 3D assets. */
export function DashboardIcon3D({ type, className, size = 20 }: DashboardIcon3DProps) {
  const name = MAP[type] ?? "listings";
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center text-current", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <AccountIcon name={name} className="h-full w-full" />
    </span>
  );
}
