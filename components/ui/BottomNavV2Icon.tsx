"use client";

import {
  ChatLineIcon,
  SearchLineIcon,
  UserLineIcon,
} from "@/components/icons/RvxLineIcons";
import type { BottomNavIconType } from "@/components/icons/BottomNavIcon3D";
import { cn } from "@/lib/cn";

const ICON_CLASS = "h-5 w-5";

type BottomNavV2IconProps = {
  type: BottomNavIconType;
  href: string;
  className?: string;
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

/** Bottom Nav — Absolute Final: one line-icon family (20px), no lucide. */
export function BottomNavV2Icon({ type, href, className }: BottomNavV2IconProps) {
  const iconClass = cn("rx-bottom-nav-v2-icon", ICON_CLASS, className);

  if (href.startsWith("/inbox") || href.startsWith("/messages") || type === "saved") {
    return <ChatLineIcon className={iconClass} />;
  }

  switch (type) {
    case "home":
      return <HomeLineIcon className={iconClass} />;
    case "search":
      return <SearchLineIcon className={iconClass} />;
    case "account":
      return <UserLineIcon className={iconClass} />;
    default:
      return <HomeLineIcon className={iconClass} />;
  }
}
