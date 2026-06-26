"use client";

import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { NotificationBadge } from "@/features/account-page/components/NotificationBadge";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

export function AccountPageHeader() {
  const { unreadCount } = useRealtimeNotifications();
  const hasUnread = unreadCount > 0;

  return (
    <header className="account-header">
      <div className="account-header__row">
        <h1 className="account-header__title">My Account</h1>
        <div className="account-header__actions">
          <Link
            href="/notifications"
            aria-label={hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications"}
            className={cn("account-header__action", focusRing)}
          >
            <Bell size={24} strokeWidth={2} aria-hidden />
            {hasUnread ? <NotificationBadge count={unreadCount} /> : null}
          </Link>
          <Link
            href="/account/settings"
            aria-label="Settings"
            className={cn("account-header__action", focusRing)}
          >
            <Settings size={24} strokeWidth={2} aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
