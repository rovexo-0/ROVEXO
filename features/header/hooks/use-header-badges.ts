"use client";

import { useEffect, useState } from "react";

type HeaderBadges = {
  unreadMessages: number;
  unreadNotifications: number;
};

const POLL_INTERVAL_MS = 60_000;

function sumUnreadMessages(conversations: Array<{ unreadCount?: number }>): number {
  return conversations.reduce((total, conversation) => total + (conversation.unreadCount ?? 0), 0);
}

function countUnreadNotifications(notifications: Array<{ read?: boolean }>): number {
  return notifications.reduce((total, notification) => total + (notification.read ? 0 : 1), 0);
}

export function useHeaderBadges(initial?: Partial<HeaderBadges>): HeaderBadges {
  const [badges, setBadges] = useState<HeaderBadges>({
    unreadMessages: initial?.unreadMessages ?? 0,
    unreadNotifications: initial?.unreadNotifications ?? 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function refreshBadges() {
      try {
        const [messagesResponse, notificationsResponse] = await Promise.all([
          fetch("/api/messages", { cache: "no-store" }),
          fetch("/api/notifications", { cache: "no-store" }),
        ]);

        if (!messagesResponse.ok || !notificationsResponse.ok) {
          return;
        }

        const messagesPayload = (await messagesResponse.json()) as {
          conversations?: Array<{ unreadCount?: number }>;
        };
        const notificationsPayload = (await notificationsResponse.json()) as {
          notifications?: Array<{ read?: boolean }>;
        };

        if (cancelled) return;

        setBadges({
          unreadMessages: sumUnreadMessages(messagesPayload.conversations ?? []),
          unreadNotifications: countUnreadNotifications(notificationsPayload.notifications ?? []),
        });
      } catch {
        // Ignore network/auth errors for anonymous sessions.
      }
    }

    void refreshBadges();
    const intervalId = window.setInterval(refreshBadges, POLL_INTERVAL_MS);

    function handleFocus() {
      void refreshBadges();
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return badges;
}

export type { HeaderBadges };
