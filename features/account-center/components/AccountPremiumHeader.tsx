"use client";

import Link from "next/link";
import { RovexoLogo } from "@/components/brand/RovexoLogo";
import { PremiumAccountIcon } from "@/components/icons/PremiumAccountIcon";
import { NotificationBadge } from "@/features/account-page/components/NotificationBadge";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { focusRing } from "@/components/ui/tokens";
import { cn } from "@/lib/cn";

/**
 * ROVEXO v1.0 — Account premium header (spec §NEW HEADER).
 * ROVEXO logo + notification + settings only, aligned horizontally on a premium
 * white surface with a soft shadow. Realistic 3D action icons.
 */
export function AccountPremiumHeader() {
  const { unreadCount } = useRealtimeNotifications();
  const hasUnread = unreadCount > 0;

  return (
    <header className="ac2-header">
      <RovexoLogo variant="full" className="ac2-header__logo" />

      <div className="ac2-header__actions">
        <Link
          href="/notifications"
          aria-label={hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications"}
          className={cn("ac2-header__action", focusRing)}
        >
          <PremiumAccountIcon icon="notification" size={26} priority />
          {hasUnread ? (
            <NotificationBadge count={unreadCount} className="ac2-header__badge" />
          ) : null}
        </Link>
        <Link
          href="/account/settings"
          aria-label="Settings"
          className={cn("ac2-header__action", focusRing)}
        >
          <PremiumAccountIcon icon="settings" size={26} priority />
        </Link>
      </div>
    </header>
  );
}
