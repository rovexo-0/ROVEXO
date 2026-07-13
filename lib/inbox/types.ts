/**
 * Canonical Inbox models — Sprint 1 foundation.
 * Reuses messages/notifications stores; does not duplicate persistence models.
 */

import type {
  ChatMessage,
  Conversation,
  ConversationParticipant,
  ConversationProduct,
} from "@/lib/messages/types";
import type { Notification, NotificationType } from "@/lib/notifications/types";

/** @deprecated Prefer ConversationMessage alias below — same runtime shape. */
export type { ChatMessage, Conversation, ConversationParticipant, ConversationProduct };

export type ConversationMessage = ChatMessage;

export type ConversationAttachment = {
  id: string;
  messageId: string;
  url: string;
  mimeType: string;
  fileName?: string;
  byteSize?: number;
  createdAt: string;
};

export type OrderReference = {
  orderId: string;
  orderNumber?: string;
  statusLabel?: string;
};

export type NotificationCategory =
  | "orders"
  | "payments"
  | "wallet"
  | "shipping"
  | "offers"
  | "reviews"
  | "security"
  | "verification"
  | "announcements"
  | "promotions"
  | "messages"
  | "system";

export type UnreadCounter = {
  messages: number;
  notifications: number;
  total: number;
};

export type InboxMessageFilter =
  | "all"
  | "unread"
  | "orders"
  | "offers"
  | "disputes"
  | "archived";

export type InboxConversationCard = Conversation & {
  orderReference?: OrderReference | null;
};

export function buildUnreadCounter(messages: number, notifications: number): UnreadCounter {
  const safeMessages = Math.max(0, Math.floor(messages));
  const safeNotifications = Math.max(0, Math.floor(notifications));
  return {
    messages: safeMessages,
    notifications: safeNotifications,
    total: safeMessages + safeNotifications,
  };
}

export function mapNotificationCategory(type: NotificationType): NotificationCategory {
  switch (type) {
    case "order":
      return "orders";
    case "payment":
      return "payments";
    case "offer":
      return "offers";
    case "review":
      return "reviews";
    case "message":
      return "messages";
    case "promotion_expired":
      return "promotions";
    case "moderation":
      return "security";
    case "follower":
    case "saved_item_sold":
    case "price_reduced":
    case "saved_search_match":
      return "announcements";
    case "system":
    default:
      return "system";
  }
}

export function filterInboxConversations(
  conversations: Conversation[],
  filter: InboxMessageFilter,
): Conversation[] {
  switch (filter) {
    case "unread":
      return conversations.filter((item) => item.unreadCount > 0 && !item.archived);
    case "orders":
      return conversations.filter((item) => !item.archived && Boolean(item.product?.id));
    case "offers":
      return conversations.filter((item) => !item.archived && item.product.acceptOffers);
    case "disputes":
      return [];
    case "archived":
      return conversations.filter((item) => item.archived);
    case "all":
    default:
      return conversations.filter((item) => !item.archived);
  }
}

export type { Notification };
