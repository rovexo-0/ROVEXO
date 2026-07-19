"use client";

import type { ReactNode } from "react";
import {
  ChatLineIcon,
  SearchLineIcon,
  UserLineIcon,
} from "@/components/icons/RvxLineIcons";
import { cn } from "@/lib/cn";

export type PremiumNavIconType = "home" | "search" | "sell" | "saved" | "account";

type PremiumNavIconProps = {
  type: PremiumNavIconType;
  /** Rendered pixel box (square). */
  size?: number;
  className?: string;
  priority?: boolean;
};

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

/** Absolute Final: line icons only — no premium nav WebP assets. */
export function PremiumNavIcon({ type, size = 28, className, priority: _priority = false }: PremiumNavIconProps) {
  const iconClass = cn("shrink-0", className);

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
      style={{ width: size, height: size }}
      aria-hidden
    >
      {icon}
    </span>
  );
}
