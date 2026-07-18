import type { Notification, NotificationFilter, NotificationType } from "@/lib/notifications/types";

export const NOTIFICATION_FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "messages", label: "Messages" },
  { id: "orders", label: "Orders" },
  { id: "offers", label: "Offers" },
  { id: "payments", label: "Payments" },
  { id: "reviews", label: "Reviews" },
  { id: "promotions", label: "Featured & Bumps" },
  { id: "moderation", label: "Moderation" },
  { id: "system", label: "System" },
];

export function getNotificationFilterCategory(type: NotificationType): NotificationFilter {
  switch (type) {
    case "message":
      return "messages";
    case "order":
      return "orders";
    case "offer":
      return "offers";
    case "review":
      return "reviews";
    case "payment":
      return "payments";
    case "follower":
      return "system";
    case "moderation":
      return "moderation";
    case "promotion_expired":
      return "promotions";
    case "saved_item_sold":
    case "price_reduced":
    case "saved_search_match":
    case "system":
      return "system";
  }
}

export function formatNotificationBadgeCount(count: number): string {
  if (count <= 0) return "";
  if (count > 99) return "99+";
  return String(count);
}

export type NotificationTimeGroup = "today" | "yesterday" | "earlier";

export function getNotificationTimeGroup(iso: string): NotificationTimeGroup {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  if (date >= startOfToday) return "today";
  if (date >= startOfYesterday) return "yesterday";
  return "earlier";
}

export function groupNotificationsByTime(notifications: Notification[]): Array<{
  group: NotificationTimeGroup;
  label: string;
  items: Notification[];
}> {
  const groups: Record<NotificationTimeGroup, Notification[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  for (const notification of notifications) {
    groups[getNotificationTimeGroup(notification.createdAt)].push(notification);
  }

  return [
    { group: "today" as const, label: "Today", items: groups.today },
    { group: "yesterday" as const, label: "Yesterday", items: groups.yesterday },
    { group: "earlier" as const, label: "Earlier", items: groups.earlier },
  ].filter((section) => section.items.length > 0);
}

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return new Intl.DateTimeFormat("en-IE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-IE", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function filterNotifications(
  notifications: Notification[],
  filter: NotificationFilter,
): Notification[] {
  if (filter === "all") return notifications;

  return notifications.filter(
    (notification) => getNotificationFilterCategory(notification.type) === filter,
  );
}

export function mapNotificationIcon(type: NotificationType): Notification["icon"] {
  switch (type) {
    case "message":
      return "message";
    case "order":
      return "order";
    case "offer":
      return "offer";
    case "review":
      return "review";
    case "payment":
      return "payment";
    case "follower":
      return "follower";
    case "moderation":
      return "moderation";
    case "promotion_expired":
      return "promotion";
    case "saved_item_sold":
    case "price_reduced":
    case "saved_search_match":
      return "product";
    case "system":
      return "system";
  }
}
