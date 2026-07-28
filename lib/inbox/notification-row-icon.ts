/**
 * Inbox Notifications — premium colored icon family (UI polish).
 * Same stroke AccountIcon set as Profile / Settings / Wallet.
 * Colour via currentColor — no monochrome-only rows.
 */

import type { AccountIconName } from "@/components/account/AccountIcons";
import type { Notification } from "@/lib/notifications/types";

export type InboxNotificationRowIcon = {
  name: AccountIconName;
  color: string;
};

/** Owner visual mapping — Profile-family palette. */
export const INBOX_NOTIFICATION_ICON_COLORS = {
  newOrder: "#F59E0B",
  fundsPending: "#22C55E",
  payment: "#60A5FA",
  counterOffer: "#9333EA",
  offer: "#EF4444",
  shipping: "#EAB308",
  read: "#94A3B8",
  system: "#9333EA",
} as const;

export function resolveInboxNotificationRowIcon(
  notification: Notification,
): InboxNotificationRowIcon {
  const title = notification.title.trim().toLowerCase();
  const unread = !notification.read;

  if (title.includes("funds pending")) {
    return { name: "wallet", color: INBOX_NOTIFICATION_ICON_COLORS.fundsPending };
  }
  if (
    title.includes("funds are now available") ||
    title.includes("payment received") ||
    title.includes("payout") ||
    title.includes("withdrawal")
  ) {
    return { name: "payment", color: INBOX_NOTIFICATION_ICON_COLORS.payment };
  }
  if (title.includes("counter")) {
    return { name: "returns", color: INBOX_NOTIFICATION_ICON_COLORS.counterOffer };
  }
  if (
    title.includes("offer received") ||
    title.includes("new offer") ||
    title.includes("offer accepted") ||
    title.includes("offer declined") ||
    title.includes("offer expired") ||
    notification.type === "offer"
  ) {
    return { name: "product", color: INBOX_NOTIFICATION_ICON_COLORS.offer };
  }
  if (
    title.includes("ship") ||
    title.includes("tracking") ||
    title.includes("delivered") ||
    title.includes("label")
  ) {
    return { name: "shipping", color: INBOX_NOTIFICATION_ICON_COLORS.shipping };
  }
  if (
    title.includes("new order") ||
    title.includes("order confirmed") ||
    title.includes("purchase") ||
    notification.type === "order"
  ) {
    return { name: "orders", color: INBOX_NOTIFICATION_ICON_COLORS.newOrder };
  }
  if (notification.type === "payment") {
    return { name: "wallet", color: INBOX_NOTIFICATION_ICON_COLORS.fundsPending };
  }
  if (notification.type === "review") {
    return { name: "reviews", color: INBOX_NOTIFICATION_ICON_COLORS.payment };
  }

  if (!unread) {
    return { name: "verification", color: INBOX_NOTIFICATION_ICON_COLORS.read };
  }

  return { name: "notifications", color: INBOX_NOTIFICATION_ICON_COLORS.system };
}
