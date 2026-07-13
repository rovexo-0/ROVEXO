/**
 * Realtime inbox foundation — Sprint 1.
 * Types + subscription surface only. No live transport yet.
 */

import type { UnreadCounter } from "@/lib/inbox/types";

export type InboxRealtimeEventType =
  | "message.created"
  | "message.updated"
  | "conversation.updated"
  | "notification.created"
  | "notification.updated"
  | "badge.updated";

export type InboxRealtimeEvent = {
  type: InboxRealtimeEventType;
  occurredAt: string;
  conversationId?: string;
  notificationId?: string;
  unread?: UnreadCounter;
};

export type InboxRealtimeHandler = (event: InboxRealtimeEvent) => void;

export type InboxRealtimeSubscription = {
  unsubscribe: () => void;
};

/**
 * Placeholder client for future SSE/WebSocket wiring.
 * Sprint 1: no-ops so callers can adopt the contract safely.
 */
export function subscribeInboxRealtime(
  handler: InboxRealtimeHandler,
): InboxRealtimeSubscription {
  void handler;
  return {
    unsubscribe() {
      /* Sprint 2+ */
    },
  };
}

export function isInboxRealtimeEnabled(): boolean {
  return false;
}
