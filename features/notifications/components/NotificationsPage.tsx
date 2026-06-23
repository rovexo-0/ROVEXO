"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BetaAppShell } from "@/components/beta/BetaAppShell";
import { CategoryChip } from "@/components/ui/CategoryChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import { NotificationCard } from "@/features/notifications/components/NotificationCard";
import { NotificationsEmptyState } from "@/features/notifications/components/NotificationsEmptyState";
import { SwipeableNotificationRow } from "@/features/notifications/components/SwipeableNotificationRow";
import { SettingsIcon } from "@/features/notifications/icons";
import {
  NOTIFICATION_FILTERS,
  filterNotifications,
} from "@/lib/notifications/utils";
import type { Notification, NotificationFilter } from "@/lib/notifications/types";

type NotificationsPageProps = {
  initialNotifications: Notification[];
};

export function NotificationsPage({ initialNotifications }: NotificationsPageProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const visibleNotifications = useMemo(
    () => filterNotifications(notifications, filter),
    [notifications, filter],
  );

  const markRead = async (ids: string[]) => {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, read: true }),
    });

    if (!response.ok) return;

    const payload = (await response.json()) as { notifications: Notification[] };
    setNotifications(payload.notifications);
  };

  const deleteItems = async (ids: string[]) => {
    const response = await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) return;

    const payload = (await response.json()) as { notifications: Notification[] };
    setNotifications(payload.notifications);
  };

  const openNotification = async (notification: Notification) => {
    if (!notification.read) {
      await markRead([notification.id]);
    }

    router.push(notification.href);
  };

  const showEmpty = notifications.length === 0;
  const showFilteredEmpty = !showEmpty && visibleNotifications.length === 0;

  return (
    <BetaAppShell showBottomNav={false}>
      <header className="premium-page-header sticky top-0 z-50">
        <div
          className={cn(
            "flex min-h-[56px] items-center justify-between gap-ds-3 px-ds-4",
            "pt-[max(env(safe-area-inset-top),var(--ds-space-3))] pb-ds-3",
          )}
        >
          <h1 className="min-w-0 truncate text-lg font-semibold text-text-primary">Notifications</h1>
          <IconButton href="/notifications/settings" label="Notification settings" variant="ghost" size="md">
            <SettingsIcon className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="flex gap-ds-2 overflow-x-auto px-ds-4 pb-ds-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NOTIFICATION_FILTERS.map((item) => (
            <CategoryChip
              key={item.id}
              label={item.label}
              active={filter === item.id}
              onClick={() => setFilter(item.id)}
            />
          ))}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-ds-3 px-ds-4 py-ds-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
        {showEmpty ? (
          <NotificationsEmptyState />
        ) : showFilteredEmpty ? (
          <EmptyState
            title="No notifications here"
            description="Try another category or check back later."
            actionLabel="Show all"
            onAction={() => setFilter("all")}
          />
        ) : (
          visibleNotifications.map((notification) => (
            <SwipeableNotificationRow
              key={notification.id}
              read={notification.read}
              onDelete={() => void deleteItems([notification.id])}
              onMarkRead={() => void markRead([notification.id])}
              onOpen={() => void openNotification(notification)}
            >
              <NotificationCard notification={notification} />
            </SwipeableNotificationRow>
          ))
        )}
      </main>
    </BetaAppShell>
  );
}
