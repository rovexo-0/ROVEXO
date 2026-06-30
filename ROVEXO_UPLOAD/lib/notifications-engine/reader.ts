import { listNotifications, getNotificationById } from "@/lib/notifications/store";
import { getNotificationBadgeCounts } from "@/lib/notifications/badge-counts-server";
import type { Notification } from "@/lib/notifications/types";
import { readLiveNotificationsEngineDocument, getNotificationsEngineSnapshotForAdmin } from "@/lib/notifications-engine/engine";
import { NOTIFICATIONS_ENGINE_MODULES } from "@/lib/notifications-engine/registry";
import {
  computeAverageOpenMinutes,
  mapNotificationToSummary,
  matchesSearch,
  matchesSummaryFilter,
} from "@/lib/notifications-engine/timeline";
import type {
  NotificationsEngineAnalytics,
  NotificationsEngineContext,
  NotificationsEngineFilterId,
  NotificationsEngineNotificationContext,
  NotificationsEngineNotificationSummary,
  NotificationsEngineSnapshot,
} from "@/lib/notifications-engine/types";

export async function getPublicNotificationsEngineConfig() {
  return readLiveNotificationsEngineDocument();
}

export async function getNotificationsEngineSnapshot(): Promise<NotificationsEngineSnapshot> {
  const { draft, live, history } = await getNotificationsEngineSnapshotForAdmin();
  return {
    scannedAt: new Date().toISOString(),
    modules: NOTIFICATIONS_ENGINE_MODULES,
    draft,
    live,
    history,
  };
}

export function computeNotificationsAnalytics(notifications: Notification[]): NotificationsEngineAnalytics {
  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return {
    sent: notifications.length,
    delivered: notifications.length,
    opened: read.length,
    clicked: read.filter((n) => n.href && n.href !== "#").length,
    dismissed: 0,
    failed: 0,
    responseRate: notifications.length ? read.length / notifications.length : 0,
    averageOpenMinutes: computeAverageOpenMinutes(notifications),
    deliveryPerformance: notifications.length ? 1 - unread.length / notifications.length : 1,
  };
}

export async function getNotificationsEngineContext(userId: string): Promise<NotificationsEngineContext> {
  const [notifications, badgeCounts] = await Promise.all([
    listNotifications(userId),
    getNotificationBadgeCounts(userId),
  ]);

  const summaries = notifications.map(mapNotificationToSummary);

  return {
    totalNotifications: notifications.length,
    unreadCount: notifications.filter((n) => !n.read).length,
    readCount: notifications.filter((n) => n.read).length,
    badgeCounts: {
      total: badgeCounts.total,
      messages: badgeCounts.messages,
      orders: badgeCounts.orders,
      notifications: badgeCounts.notifications,
      saved: badgeCounts.saved,
      wallet: badgeCounts["wallet-payout"],
    },
    recentNotifications: summaries.slice(0, 5),
  };
}

export async function getNotificationsEngineNotificationContext(
  notificationId: string,
  userId: string,
): Promise<NotificationsEngineNotificationContext | null> {
  const [notification, config] = await Promise.all([
    getNotificationById(notificationId, userId),
    readLiveNotificationsEngineDocument(),
  ]);
  if (!notification) return null;

  return {
    summary: mapNotificationToSummary(notification),
    messagesIntegrated: config.integrations.messagesEngine,
    ordersIntegrated: config.integrations.ordersEngine,
    shippingIntegrated: config.integrations.shippingEngine,
    walletIntegrated: config.integrations.walletEngine,
    paymentsIntegrated: config.integrations.paymentsEngine,
    protectionIntegrated: config.integrations.protectionEngine,
  };
}

export async function listNotificationsEngineSummaries(
  userId: string,
  options?: { filter?: NotificationsEngineFilterId; query?: string },
): Promise<NotificationsEngineNotificationSummary[]> {
  const notifications = await listNotifications(userId);
  return notifications
    .map(mapNotificationToSummary)
    .filter((summary) => (options?.filter ? matchesSummaryFilter(summary, options.filter) : true))
    .filter((summary) => (options?.query ? matchesSearch(options.query, summary) : true));
}

export async function getNotificationsEngineAnalyticsForUser(userId: string): Promise<NotificationsEngineAnalytics> {
  const notifications = await listNotifications(userId);
  return computeNotificationsAnalytics(notifications);
}
