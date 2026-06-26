"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { Button } from "@/components/ui/Button";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { NotificationItem } from "@/features/notifications/components/NotificationItem";
import { NotificationsEmptyState } from "@/features/notifications/components/NotificationsEmptyState";
import { SwipeableNotificationRow } from "@/features/notifications/components/SwipeableNotificationRow";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";
import { SettingsIcon } from "@/features/notifications/icons";
import {
  NOTIFICATION_FILTERS,
  filterNotifications,
  groupNotificationsByTime,
} from "@/lib/notifications/utils";
import { enqueueOfflineNotificationAction } from "@/lib/notifications/offline-sync";
import type { Notification, NotificationFilter } from "@/lib/notifications/types";

type NotificationCenterProps = {
  initialNotifications: Notification[];
};

type InboxTab = "all" | "unread" | "read";

export function NotificationCenter({ initialNotifications }: NotificationCenterProps) {
  const router = useRouter();
  const { setNotifications, refresh } = useRealtimeNotifications();
  const [notifications, setLocalNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [inboxTab, setInboxTab] = useState<InboxTab>("all");
  const [busy, setBusy] = useState(false);

  const syncNotifications = (next: Notification[]) => {
    setLocalNotifications(next);
    setNotifications(next);
  };

  const filtered = useMemo(() => {
    let items = filterNotifications(notifications, filter);
    if (inboxTab === "unread") items = items.filter((item) => !item.read);
    if (inboxTab === "read") items = items.filter((item) => item.read);
    return items;
  }, [notifications, filter, inboxTab]);

  const unreadSections = useMemo(
    () => groupNotificationsByTime(filtered.filter((item) => !item.read)),
    [filtered],
  );
  const readSections = useMemo(
    () => groupNotificationsByTime(filtered.filter((item) => item.read)),
    [filtered],
  );

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

  const deleteItems = async (ids: string[]) => {
    const response = await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
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

  const clearAllRead = async () => {
    setBusy(true);
    if (!navigator.onLine) {
      enqueueOfflineNotificationAction({ type: "delete_read" });
      syncNotifications(notifications.filter((item) => !item.read));
      setBusy(false);
      return;
    }

    const response = await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clearRead: true }),
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

  const showEmpty = notifications.length === 0;
  const showFilteredEmpty = !showEmpty && filtered.length === 0;

  const renderSection = (title: string, items: Notification[]) => (
    <section key={title} className="flex flex-col gap-3" aria-label={title}>
      <h2 className="dash-v1-section__title">{title}</h2>
      {items.map((notification) => (
        <SwipeableNotificationRow
          key={notification.id}
          read={notification.read}
          onDelete={() => void deleteItems([notification.id])}
          onMarkRead={() => void markRead([notification.id])}
          onOpen={() => void openNotification(notification)}
        >
          <NotificationItem notification={notification} />
        </SwipeableNotificationRow>
      ))}
    </section>
  );

  return (
    <BetaAppShell showBottomNav={false}>
      <header className="dash-v1-header">
        <div className="dash-v1-header__row">
          <h1 className="dash-v1-header__title">Notifications</h1>
          <IconButton href="/notifications/settings" label="Notification settings" variant="ghost" size="md">
            <SettingsIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="mt-3 flex gap-2">
          {(["all", "unread", "read"] as const).map((tab) => (
            <CategoryChip
              key={tab}
              label={tab === "all" ? "All" : tab === "unread" ? "Unread" : "Read"}
              active={inboxTab === tab}
              onClick={() => setInboxTab(tab)}
            />
          ))}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NOTIFICATION_FILTERS.map((item) => (
            <CategoryChip
              key={item.id}
              label={item.label}
              active={filter === item.id}
              onClick={() => setFilter(item.id)}
            />
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void markAllRead()}>
            Mark all as read
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void clearAllRead()}>
            Clear all read
          </Button>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto flex w-full max-w-2xl flex-col gap-5 bg-white px-5 py-5",
          "pb-[calc(20px+env(safe-area-inset-bottom))]",
        )}
      >
        {showEmpty ? (
          <NotificationsEmptyState />
        ) : showFilteredEmpty ? (
          <EmptyState
            title="No notifications here"
            description="Try another filter or check back later."
            actionLabel="Show all"
            onAction={() => {
              setFilter("all");
              setInboxTab("all");
            }}
          />
        ) : (
          <>
            {inboxTab !== "read" &&
              unreadSections.map((section) => renderSection(section.label, section.items))}
            {inboxTab !== "unread" &&
              readSections.map((section) => renderSection(section.label, section.items))}
          </>
        )}
      </main>
    </BetaAppShell>
  );
}
