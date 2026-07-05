"use client";

import Link from "next/link";
import type { CommandCenterNotification } from "@/lib/super-admin/command-center-v1/types";
import { LiveStatusBadge } from "@/features/super-admin/command-center-v1/components/LiveStatusBadge";

type NotificationsPanelProps = {
  notifications: CommandCenterNotification[];
};

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  return (
    <section className="cc1-panel" aria-labelledby="cc1-notifications-heading">
      <header className="cc1-panel__header">
        <h2 id="cc1-notifications-heading" className="cc1-panel__title">
          Live Notifications
        </h2>
        <p className="cc1-panel__subtitle">Critical, warnings, and system updates</p>
      </header>
      <ul className="cc1-notifications">
        {notifications.length === 0 ? (
          <li className="cc1-notifications__empty" role="status" aria-live="polite">
            <p className="cc1-notifications__empty-title">System operating normally.</p>
            <LiveStatusBadge label="Healthy" variant="healthy" className="cc1-notifications__empty-badge" />
          </li>
        ) : (
          notifications.map((notification) => (
            <li key={notification.id} className={`cc1-notifications__item cc1-notifications__item--${notification.tone}`}>
              {notification.href ? (
                <Link href={notification.href} className="cc1-notifications__link">
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                </Link>
              ) : (
                <>
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                </>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
