"use client";

import Link from "next/link";
import { DashboardIcon3D } from "@/components/icons/DashboardIcon3D";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { formatNotificationBadgeCount } from "@/lib/notifications/utils";
import { cn } from "@/lib/cn";
import { focusRing } from "@/components/ui/tokens";

type NotificationBellProps = {
  className?: string;
  href?: string;
  size?: number;
};

export function NotificationBell({
  className,
  href = "/notifications",
  size = 28,
}: NotificationBellProps) {
  const { unreadCount } = useRealtimeNotifications();
  const label = formatNotificationBadgeCount(unreadCount);
  const hasUnread = unreadCount > 0;

  return (
    <Link
      href={href}
      aria-label={hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications"}
      className={cn("rx-dash-header__action relative", focusRing, className)}
    >
      <DashboardIcon3D type="notifications" size={size} />
      {hasUnread ? (
        <span className="rx-dash-badge rx-dash-badge--danger right-1 top-1" aria-hidden>
          {label}
        </span>
      ) : null}
    </Link>
  );
}
