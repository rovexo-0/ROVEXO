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

const NOTIFICATION_CTA_COPY =
  /\b(visit|complete|open|view|checkout|trust center|click|tap|please|successfully)\b/i;
const NOTIFICATION_TECHNICAL_COPY =
  /\b(your offer was accepted\.|you received an offer on|you have|added your item|has left you|trust score)\b/i;
const TRUST_TIER_ENTITY =
  /\b(bronze|silver|gold|platinum|diamond)(?:\s+member)?\b/i;

function firstQuoted(text: string): string | null {
  const match = text.match(/"([^"]+)"/);
  const value = match?.[1]?.trim();
  return value ? value : null;
}

function afterKeyword(text: string, keyword: RegExp): string | null {
  const match = text.match(keyword);
  const value = match?.[1]?.trim().replace(/[."]+$/g, "");
  return value ? value : null;
}

function trustMemberEntity(text: string): string | null {
  const paren = text.match(/\(([^)]+)\)/);
  const fromParen = paren?.[1]?.trim() ?? "";
  const tierMatch = (fromParen || text).match(TRUST_TIER_ENTITY);
  if (!tierMatch?.[1]) return null;
  const tier = tierMatch[1].charAt(0).toUpperCase() + tierMatch[1].slice(1).toLowerCase();
  return `${tier} Member`;
}

function isUsableEntityLine(text: string): boolean {
  const value = text.trim();
  if (!value || value.length > 72) return false;
  if (NOTIFICATION_CTA_COPY.test(value)) return false;
  if (NOTIFICATION_TECHNICAL_COPY.test(value)) return false;
  return true;
}

function looksLikeProductTitle(text: string): boolean {
  const value = text.trim();
  if (!value || value.length > 72) return false;
  if (/^£[\d.,]+$/.test(value)) return false;
  if (/^★+$/.test(value) || /^\d★/.test(value)) return false;
  if (/tracking/i.test(value)) return false;
  if (/offered|requested|favourited|favorited/i.test(value)) return false;
  return isUsableEntityLine(value);
}

/**
 * Spring 2 Transaction Hub — Owner notification row:
 * Product title · Event title · Short description
 */
export function resolveInboxNotificationDisplay(notification: Notification): {
  productTitle: string;
  eventTitle: string;
  description: string;
  /** @deprecated alias of eventTitle — keep for older call sites */
  title: string;
} {
  const eventTitle = notification.title.trim();
  const subtitle = (notification.subtitle ?? "").trim();
  const detail = (notification.detail ?? "").trim();
  const avatarName = (notification.avatarName ?? "").trim();
  const haystack = `${subtitle}\n${detail}`;

  if (/trust score/i.test(eventTitle)) {
    const description =
      [detail, trustMemberEntity(haystack), avatarName].find(
        (part) => part && isUsableEntityLine(part),
      ) ??
      trustMemberEntity(haystack) ??
      "";
    return { productTitle: "", eventTitle, description, title: eventTitle };
  }

  const productTitle =
    [avatarName, firstQuoted(haystack), detail]
      .find((part): part is string => Boolean(part && looksLikeProductTitle(part))) ?? "";

  let description = "";
  if (notification.type === "message") {
    description =
      [subtitle, firstQuoted(subtitle)].find((part) => part && isUsableEntityLine(part)) ??
      subtitle.slice(0, 72);
  } else {
    const candidates = [
      subtitle,
      detail && detail !== productTitle ? detail : "",
      afterKeyword(haystack, /purchased:\s*(.+)/i),
    ];
    description =
      candidates.find(
        (part): part is string =>
          Boolean(part && isUsableEntityLine(part) && part.trim() !== productTitle),
      ) ?? "";
  }

  return {
    productTitle,
    eventTitle,
    description,
    title: eventTitle,
  };
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

export function formatNotificationTime(iso: string, nowMs = Date.now()): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const diffMs = Math.max(0, nowMs - then);
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks} weeks ago`;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
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
