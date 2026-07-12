"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { NotificationsEmptyState } from "@/features/notifications/components/NotificationsEmptyState";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { NotificationLineIcon } from "@/features/notifications/icons-v1";
import { enqueueOfflineNotificationAction } from "@/lib/notifications/offline-sync";
import { formatNotificationTime } from "@/lib/notifications/utils";
import type { Notification } from "@/lib/notifications/types";

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: Notification;
  onOpen: (notification: Notification) => void;
}) {
  return (
    <button type="button" className="notif-row" onClick={() => onOpen(notification)}>
      <span className="notif-row__icon">
        <NotificationLineIcon icon={notification.icon} />
      </span>
      <span className="notif-row__body">
        <span className="notif-row__top">
          <span className="notif-row__title">{notification.title}</span>
          <time className="notif-row__time" dateTime={notification.createdAt}>
            {formatNotificationTime(notification.createdAt)}
          </time>
        </span>
        <span className="notif-row__subtitle">{notification.subtitle}</span>
      </span>
      {!notification.read ? <span className="notif-row__dot" aria-label="Unread" /> : <span className="notif-row__dot-spacer" />}
    </button>
  );
}

function NotificationsListSkeleton() {
  return (
    <ul className="notif-v1__list" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <li key={index} className="notif-row" style={{ pointerEvents: "none" }}>
          <span className="notif-row__icon rounded-full bg-[var(--ds-color-surface-muted)]" />
          <span className="notif-row__body flex flex-col gap-2">
            <span className="h-4 w-2/3 rounded bg-[var(--ds-color-surface-muted)]" />
            <span className="h-3 w-full rounded bg-[var(--ds-color-surface-muted)]" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function NotificationsInboxV1() {
  const router = useRouter();
  const { setNotifications, refresh } = useRealtimeNotifications();
  const [notifications, setLocalNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/notifications", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { notifications?: Notification[] } | null) => {
        if (!cancelled && payload?.notifications) {
          setLocalNotifications(payload.notifications);
          setNotifications(payload.notifications);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [setNotifications]);

  const syncNotifications = (next: Notification[]) => {
    setLocalNotifications(next);
    setNotifications(next);
  };

  const markRead = async (ids: string[]) => {
    if (!navigator.onLine) {
      enqueueOfflineNotificationAction({ type: "mark_read", ids });
      syncNotifications(
        notifications.map((item) => (ids.includes(item.id) ? { ...item, read: true } : item)),
      );
      return;
    }

    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, read: true }),
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { notifications: Notification[] };
    syncNotifications(payload.notifications);
    await refresh();
  };

  const markAllRead = async () => {
    setBusy(true);
    if (!navigator.onLine) {
      enqueueOfflineNotificationAction({ type: "mark_all_read" });
      syncNotifications(notifications.map((item) => ({ ...item, read: true })));
      setBusy(false);
      return;
    }

    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    if (response.ok) {
      const payload = (await response.json()) as { notifications: Notification[] };
      syncNotifications(payload.notifications);
      await refresh();
    }
    setBusy(false);
  };

  const openNotification = async (notification: Notification) => {
    if (!notification.read) {
      await markRead([notification.id]);
    }
    router.push(notification.href);
  };

  return (
    <BetaAppShell className="notif-v1-shell" bottomNavTab="account">
      <div className="notif-v1" data-notifications-version="v1.0">
        <CanonicalPageHeader
          title="Notifications"
          backHref="/account"
          backLabel="My Account"
          rightAction={
            <button
              type="button"
              className="min-h-12 px-ds-1 text-sm font-semibold text-primary disabled:opacity-50"
              disabled={busy || notifications.every((item) => item.read)}
              onClick={() => void markAllRead()}
            >
              Mark all read
            </button>
          }
        />

        {loading ? (
          <NotificationsListSkeleton />
        ) : notifications.length === 0 ? (
          <div className="mx-auto w-full max-w-[640px] px-5 py-10">
            <NotificationsEmptyState />
          </div>
        ) : (
          <ul className="notif-v1__list">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <NotificationRow notification={notification} onOpen={(item) => void openNotification(item)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </BetaAppShell>
  );
}
