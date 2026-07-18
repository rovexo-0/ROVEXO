"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { BellLineIcon } from "@/components/icons/RvxLineIcons";
import { focusRing, transitionNormal } from "@/components/ui/tokens";

type NotificationBellProps = {
  unreadCount?: number;
};

export default function NotificationBell({
  unreadCount = 0,
}: NotificationBellProps) {
  const hasUnread = unreadCount > 0;

  return (
    <Link
      href="/notifications"
      aria-label={
        hasUnread
          ? `Notifications, ${unreadCount} unread`
          : "Notifications"
      }
      className={cn(
        "relative flex min-h-ds-7 min-w-ds-7 shrink-0 items-center justify-center rounded-ds-md text-text-secondary",
        transitionNormal,
        "hover:bg-secondary hover:text-text-primary",
        focusRing
      )}
    >
      <BellLineIcon className="h-5 w-5" />

      {hasUnread && (
        <span
          className="absolute right-1.5 top-1.5 flex min-h-[0.625rem] min-w-[0.625rem] items-center justify-center rounded-full bg-danger px-[0.1875rem] text-[10px] font-bold text-white"
          aria-hidden
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
