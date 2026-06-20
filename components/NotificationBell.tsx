"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { focusRing, transitionNormal } from "@/components/ui/tokens";

type NotificationBellProps = {
  unreadCount?: number;
};

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0018 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 00-2.31 6.022 23.848 23.848 0 005.454 1.31m5.713 0a24.255 24.255 0 01-5.713 0m5.713 0a3 3 0 11-5.713 0"
      />
    </svg>
  );
}

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
      <BellIcon className="h-5 w-5" />

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