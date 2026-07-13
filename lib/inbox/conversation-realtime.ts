/**
 * Conversation Hub realtime foundation — Sprint 2.
 * Contract only. Live wiring expands in Sprint 3.
 */

import type { UnreadCounter } from "@/lib/inbox/types";

export type ConversationRealtimeEventType =
  | "message.created"
  | "message.updated"
  | "typing.started"
  | "typing.stopped"
  | "receipt.read"
  | "receipt.delivered"
  | "tracking.updated"
  | "dispute.updated"
  | "offer.updated"
  | "badge.updated";

export type ConversationRealtimeEvent = {
  type: ConversationRealtimeEventType;
  conversationId: string;
  occurredAt: string;
  unread?: UnreadCounter;
  payload?: Record<string, unknown>;
};

export type ConversationRealtimeHandler = (event: ConversationRealtimeEvent) => void;

export type ConversationRealtimeSubscription = {
  unsubscribe: () => void;
};

/** Placeholder subscribe for Sprint 3 transport. */
export function subscribeConversationRealtime(
  conversationId: string,
  handler: ConversationRealtimeHandler,
): ConversationRealtimeSubscription {
  void conversationId;
  void handler;
  return {
    unsubscribe() {
      /* Sprint 3+ */
    },
  };
}

export function isConversationRealtimeEnabled(): boolean {
  return false;
}
