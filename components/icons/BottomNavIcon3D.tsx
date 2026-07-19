"use client";

import type { ReactNode } from "react";
import {
  ChatLineIcon,
  SearchLineIcon,
  UserLineIcon,
} from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";
import type { BottomNavIconType } from "@/lib/icons/bottom-nav-icon-type";

export type { BottomNavIconType };

type BottomNavIcon3DProps = {
  type: BottomNavIconType;
  active?: boolean;
  className?: string;
  /** Tab icons render at 32px; sell stays at 34px inside the sell button. */
  size?: "tab" | "sell";
};

const TAB_ICON_PX = 32;
const SELL_ICON_PX = 34;

function HomeLineIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

function SellPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      aria-hidden
      className={className}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/** Absolute Final: RvxLineIcons only — no Fluency 3D assets. */
export function BottomNavIcon3D({ type, active, className, size = "tab" }: BottomNavIcon3DProps) {
  const px = size === "sell" ? SELL_ICON_PX : TAB_ICON_PX;
  const iconClass = cn(
    "h-full w-full transition-opacity duration-200",
    active ? "opacity-100" : "opacity-90",
    className,
  );

  let icon: ReactNode;
  switch (type) {
    case "home":
      icon = <HomeLineIcon className={iconClass} />;
      break;
    case "search":
      icon = <SearchLineIcon className={iconClass} />;
      break;
    case "sell":
      icon = <SellPlusIcon className={iconClass} />;
      break;
    case "saved":
      icon = <ChatLineIcon className={iconClass} />;
      break;
    case "account":
      icon = <UserLineIcon className={iconClass} />;
      break;
    default:
      icon = <HomeLineIcon className={iconClass} />;
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center text-current"
      style={{ width: px, height: px }}
      aria-hidden
    >
      {icon}
    </span>
  );
}
