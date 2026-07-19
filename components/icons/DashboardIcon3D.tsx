"use client";

import {
  BagLineIcon,
  BellLineIcon,
  CartLineIcon,
  ChatLineIcon,
  HeartLineIcon,
  SearchLineIcon,
  SettingsLineIcon,
  TagLineIcon,
  UserLineIcon,
  WalletLineIcon,
} from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import {
  resolveDashboardIconType,
  type DashboardIconType,
} from "@/lib/icons/resolve-dashboard-icon-type";
import type { ComponentType, SVGProps } from "react";

export type { DashboardIconType };
export { resolveDashboardIconType };

type DashboardIcon3DProps = {
  type: DashboardIconType;
  className?: string;
  size?: number;
};

type IconProps = SVGProps<SVGSVGElement>;

function HomeLineIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

const MAP: Record<string, ComponentType<IconProps>> = {
  home: HomeLineIcon,
  search: SearchLineIcon,
  sell: TagLineIcon,
  saved: HeartLineIcon,
  account: UserLineIcon,
  notifications: BellLineIcon,
  settings: SettingsLineIcon,
  categories: TagLineIcon,
  messages: ChatLineIcon,
  wallet: WalletLineIcon,
  orders: BagLineIcon,
  cart: CartLineIcon,
  "buy-hub": BagLineIcon,
  "sell-hub": TagLineIcon,
  "business-hub": UserLineIcon,
  "support-hub": ChatLineIcon,
  listings: TagLineIcon,
  business: UserLineIcon,
  help: ChatLineIcon,
  support: ChatLineIcon,
  inventory: TagLineIcon,
};

/** Absolute Final: line icons only — no Fluency 3D / dashboard 3D assets. */
export function DashboardIcon3D({ type, className, size = 20 }: DashboardIcon3DProps) {
  const Icon = MAP[type] ?? TagLineIcon;
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center text-current", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Icon className="h-full w-full" />
    </span>
  );
}
