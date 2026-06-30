import type { Notification, NotificationType } from "@/lib/notifications/types";
import { getNotificationFilterCategory } from "@/lib/notifications/utils";
import type {
  NotificationsEngineFilterId,
  NotificationsEngineNotificationSummary,
  NotificationsEnginePriorityId,
  NotificationsEngineTypeId,
} from "@/lib/notifications-engine/types";

export function mapLegacyTypeToEnterprise(type: NotificationType): NotificationsEngineTypeId {
  const map: Partial<Record<NotificationType, NotificationsEngineTypeId>> = {
    message: "buyer",
    order: "buyer",
    offer: "seller",
    review: "seller",
    payment: "buyer",
    follower: "buyer",
    moderation: "administrator",
    promotion_expired: "marketing",
    saved_item_sold: "buyer",
    price_reduced: "buyer",
    saved_search_match: "buyer",
    system: "system",
  };
  return map[type] ?? "platform";
}

export function derivePriority(notification: Notification): NotificationsEnginePriorityId {
  if (notification.type === "moderation") return "critical";
  if (notification.type === "payment") return "important";
  if (notification.type === "order") return "important";
  if (notification.type === "message") return "information";
  if (notification.type === "system") return "warning";
  return "information";
}

export function mapNotificationToFilters(notification: Notification): NotificationsEngineFilterId[] {
  const tags: NotificationsEngineFilterId[] = ["all"];
  if (!notification.read) tags.push("unread");
  if (notification.read) tags.push("read");

  const category = getNotificationFilterCategory(notification.type);
  if (category === "messages") tags.push("messages");
  if (category === "orders") tags.push("orders");
  if (category === "payments") tags.push("payments");
  if (category === "moderation") tags.push("security");
  if (category === "system") tags.push("system");

  if (notification.href.startsWith("/shipping")) tags.push("shipping");
  if (notification.href.startsWith("/protection") || notification.href.startsWith("/resolution")) {
    tags.push("protection");
  }

  return tags;
}

export function mapNotificationToSummary(notification: Notification): NotificationsEngineNotificationSummary {
  return {
    notificationId: notification.id,
    legacyType: notification.type,
    enterpriseType: mapLegacyTypeToEnterprise(notification.type),
    priority: derivePriority(notification),
    title: notification.title,
    subtitle: notification.subtitle,
    href: notification.href,
    read: notification.read,
    createdAt: notification.createdAt,
    filterTags: mapNotificationToFilters(notification),
  };
}

export function matchesSummaryFilter(
  summary: NotificationsEngineNotificationSummary,
  filter: NotificationsEngineFilterId,
): boolean {
  if (filter === "all") return true;
  return summary.filterTags.includes(filter);
}

export function matchesSearch(query: string, summary: NotificationsEngineNotificationSummary): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    summary.title.toLowerCase().includes(q) ||
    summary.subtitle.toLowerCase().includes(q) ||
    summary.legacyType.toLowerCase().includes(q)
  );
}

export function computeAverageOpenMinutes(notifications: Notification[]): number {
  const read = notifications.filter((n) => n.read);
  if (!read.length) return 0;

  const totalMinutes = read.reduce((sum, n) => {
    const minutes = (Date.now() - new Date(n.createdAt).getTime()) / (1000 * 60);
    return sum + Math.min(minutes, 7 * 24 * 60);
  }, 0);

  return Math.round((totalMinutes / read.length) * 10) / 10;
}
