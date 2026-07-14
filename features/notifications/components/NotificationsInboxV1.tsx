"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CanonicalPageHeader } from "@/components/navigation/CanonicalPageHeader";
import { NotificationsEmptyState } from "@/features/notifications/components/NotificationsEmptyState";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { NotificationLineIcon } from "@/features/notifications/icons-v1";
import { enqueueOfflineNotificationAction } from "@/lib/notifications/offline-sync";
import { formatNotificationTime } from "@/lib/notifications/utils";
import type { Notification } from "@/lib/notifications/types";
import "@/styles/rovexo/notifications-v1.css";

const PAGE_SIZE = 20;

function groupKeyFor(notification: Notification) {
  const day = notification.createdAt.slice(0, 10);
  return `${notification.type}:${notification.href.split("?")[0]}:${day}`;
}

function NotificationRow({
  notification,
  onOpen,
  onDelete,
}: {
  notification: Notification;
  onOpen: (notification: Notification) => void;
  onDelete: (notification: Notification) => void;
}) {
  return (
    <div className="notif-row-wrap">
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
        {!notification.read ? (
          <span className="notif-row__dot" aria-label="Unread" />
        ) : (
          <span className="notif-row__dot-spacer" />
        )}
      </button>
      <button
        type="button"
        className="notif-row__delete"
        aria-label={`Delete ${notification.title}`}
        onClick={() => onDelete(notification)}
      >
        Delete
      </button>
    </div>
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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [, startTransition] = useTransition();

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

  const deleteNotification = async (notification: Notification) => {
    const previous = notifications;
    syncNotifications(notifications.filter((item) => item.id !== notification.id));

    if (!navigator.onLine) {
      enqueueOfflineNotificationAction({ type: "delete", ids: [notification.id] });
      return;
    }

    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [notification.id], delete: true }),
    });
    if (!response.ok) {
      syncNotifications(previous);
      return;
    }
    const payload = (await response.json()) as { notifications: Notification[] };
    syncNotifications(payload.notifications);
    await refresh();
  };

  const openNotification = async (notification: Notification) => {
    if (!notification.read) {
      await markRead([notification.id]);
    }
    router.push(notification.href);
  };

  const visible = useMemo(
    () => notifications.slice(0, visibleCount),
    [notifications, visibleCount],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Notification[]>();
    for (const item of visible) {
      const key = groupKeyFor(item);
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return Array.from(map.entries());
  }, [visible]);

  const hasMore = visibleCount < notifications.length;

  return (
    <BetaAppShell className="notif-v1-shell" bottomNavTab="saved">
      <div className="notif-v1" data-notifications-version="v1.0" data-notifications-canonical="v1.0">
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
          <>
            <ul className="notif-v1__list">
              {grouped.map(([key, items]) => (
                <li key={key} className="notif-v1__group">
                  {items.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      notification={notification}
                      onOpen={(item) => void openNotification(item)}
                      onDelete={(item) => void deleteNotification(item)}
                    />
                  ))}
                </li>
              ))}
            </ul>
            {hasMore ? (
              <div className="mx-auto flex w-full max-w-[640px] justify-center px-5 pb-24">
                <button
                  type="button"
                  className="min-h-12 rounded-2xl px-5 text-sm font-semibold text-primary"
                  onClick={() =>
                    startTransition(() => {
                      setVisibleCount((count) => count + PAGE_SIZE);
                    })
                  }
                >
                  Load more
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </BetaAppShell>
  );
}
