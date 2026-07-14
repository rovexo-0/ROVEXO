"use client";

import { NotificationsInboxV1 } from "@/features/notifications/components/NotificationsInboxV1";
import type { Notification } from "@/lib/notifications/types";

type NotificationsPageProps = {
  /** @deprecated Initial list is loaded by NotificationsInboxV1. */
  initialNotifications?: Notification[];
};

/**
 * Legacy alias — canonical list UI is `NotificationsInboxV1`.
 * Live user list remains Inbox Hub (`/inbox?tab=notifications`).
 */
export function NotificationsPage(_props: NotificationsPageProps) {
  void _props;
  return <NotificationsInboxV1 />;
}
