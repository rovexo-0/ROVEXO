"use client";

import { Home, MessageSquare, Search, User } from "lucide-react";
import type { BottomNavIconType } from "@/components/icons/BottomNavIcon3D";
import { cn } from "@/lib/cn";

const ICON_SIZE = 20;
const ICON_STROKE = 2;

type BottomNavV2IconProps = {
  type: BottomNavIconType;
  href: string;
  className?: string;
};

/** Bottom Nav V2 — Master icon size 20px; Inbox matches /inbox and /messages. */
export function BottomNavV2Icon({ type, href, className }: BottomNavV2IconProps) {
  const props = {
    size: ICON_SIZE,
    strokeWidth: ICON_STROKE,
    className: cn("rx-bottom-nav-v2-icon", className),
    "aria-hidden": true as const,
  };

  if (href.startsWith("/inbox") || href.startsWith("/messages") || type === "saved") {
    return <MessageSquare {...props} />;
  }

  switch (type) {
    case "home":
      return <Home {...props} />;
    case "search":
      return <Search {...props} />;
    case "account":
      return <User {...props} />;
    default:
      return <Home {...props} />;
  }
}
