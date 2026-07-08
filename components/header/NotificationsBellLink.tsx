"use client";

import { RvxTopBarIconLink } from "@/components/header/RvxTopBar";
import { BellLineIcon } from "@/components/icons/RvxLineIcons";
import { useRealtimeNotifications } from "@/features/notifications/components/RealtimeNotificationProvider";

export function NotificationsBellLink() {
  const { mobileBadges } = useRealtimeNotifications();
  return (
    <RvxTopBarIconLink href="/notifications" label="Notifications" badge={mobileBadges.notifications}>
      <BellLineIcon />
    </RvxTopBarIconLink>
  );
}
