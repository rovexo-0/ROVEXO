"use client";

import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";

type HeaderBadgeSeed = {
  unreadMessages?: number;
  unreadNotifications?: number;
};

export function useHeaderBadges(initial?: HeaderBadgeSeed) {
  const realtime = useRealtimeNotifications();

  return {
    unreadMessages: realtime.mobileBadges.messages || (initial?.unreadMessages ?? 0),
    unreadNotifications: realtime.unreadCount || (initial?.unreadNotifications ?? 0),
  };
}
