/**
 * Conversation Hub realtime — live transport for Messages (COD SÂNGE final cleanup).
 * Subscribes to messages/offers/orders/protection changes and maps them to hub events.
 * Does not modify Offers/Orders/Shipping/Escrow engines — transport only.
 */

import { tryCreateClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
  | "order.updated"
  | "badge.updated";

export type ConversationRealtimeEvent = {
  type: ConversationRealtimeEventType;
  conversationId: string;
  occurredAt: string;
  payload?: Record<string, unknown>;
};

export type ConversationRealtimeHandler = (event: ConversationRealtimeEvent) => void;

export type ConversationRealtimeSubscription = {
  unsubscribe: () => void;
};

export type ConversationRealtimeContext = {
  productId?: string | null;
  orderId?: string | null;
  buyerId?: string | null;
  sellerId?: string | null;
};

function emit(
  handler: ConversationRealtimeHandler,
  conversationId: string,
  type: ConversationRealtimeEventType,
  payload?: Record<string, unknown>,
) {
  handler({
    type,
    conversationId,
    occurredAt: new Date().toISOString(),
    payload,
  });
}

function mapOrderStatusToEvent(status: unknown): ConversationRealtimeEventType {
  const s = String(status ?? "");
  if (s === "issue_open") return "dispute.updated";
  if (s === "shipped" || s === "delivered" || s === "awaiting_shipment" || s === "completed") {
    return "tracking.updated";
  }
  return "order.updated";
}

/**
 * Live subscribe for Conversation Hub lifecycle.
 * Messages stream remains in useChatRealtime; this covers offers/orders/disputes + message inserts.
 */
export function subscribeConversationRealtime(
  conversationId: string,
  handler: ConversationRealtimeHandler,
  context: ConversationRealtimeContext = {},
): ConversationRealtimeSubscription {
  const supabase = tryCreateClient();
  if (!supabase || !conversationId) {
    return { unsubscribe() {} };
  }

  const channels: RealtimeChannel[] = [];

  const messages = supabase
    .channel(`hub-rt-messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        emit(handler, conversationId, "message.created", payload.new as Record<string, unknown>);
        emit(handler, conversationId, "badge.updated");
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        emit(handler, conversationId, "message.updated", payload.new as Record<string, unknown>);
      },
    )
    .subscribe();
  channels.push(messages);

  const productId = context.productId?.trim();
  if (productId) {
    const offers = supabase
      .channel(`hub-rt-offers:${conversationId}:${productId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offers",
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          try {
            // TEMP P0: postgres change received on this client; emit drives peer UI.
            console.info("[ROVEXO][PUSH_RT_FLOW]", "REALTIME_EVENT_RECEIVED", {
              table: "offers",
              event: payload.eventType,
              conversationId,
              productId,
            });
            console.info("[ROVEXO][PUSH_RT_FLOW]", "REALTIME_EVENT_SENT", {
              table: "offers",
              hubEvent: "offer.updated",
              conversationId,
              productId,
            });
          } catch {
            /* ignore */
          }
          emit(handler, conversationId, "offer.updated", (payload.new ?? payload.old) as Record<
            string,
            unknown
          >);
          emit(handler, conversationId, "badge.updated");
        },
      )
      .subscribe();
    channels.push(offers);
  }

  const orderId = context.orderId?.trim();
  if (orderId) {
    const orders = supabase
      .channel(`hub-rt-orders:${conversationId}:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<string, unknown>;
          emit(handler, conversationId, mapOrderStatusToEvent(row.status), row);
          emit(handler, conversationId, "badge.updated");
        },
      )
      .subscribe();
    channels.push(orders);

    const cases = supabase
      .channel(`hub-rt-cases:${conversationId}:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "protection_cases",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          emit(
            handler,
            conversationId,
            "dispute.updated",
            (payload.new ?? payload.old) as Record<string, unknown>,
          );
          emit(handler, conversationId, "badge.updated");
        },
      )
      .subscribe();
    channels.push(cases);
  }

  /* Before an order exists, watch buyer/seller order inserts for this product via broad role filters. */
  if (!orderId && (context.buyerId || context.sellerId)) {
    const roleId = context.buyerId || context.sellerId;
    const column = context.buyerId ? "buyer_id" : "seller_id";
    if (roleId) {
      const pendingOrders = supabase
        .channel(`hub-rt-orders-role:${conversationId}:${roleId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
            filter: `${column}=eq.${roleId}`,
          },
          (payload) => {
            emit(handler, conversationId, "order.updated", payload.new as Record<string, unknown>);
            emit(handler, conversationId, "badge.updated");
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `${column}=eq.${roleId}`,
          },
          (payload) => {
            const row = payload.new as Record<string, unknown>;
            emit(handler, conversationId, mapOrderStatusToEvent(row.status), row);
            emit(handler, conversationId, "badge.updated");
          },
        )
        .subscribe();
      channels.push(pendingOrders);
    }
  }

  return {
    unsubscribe() {
      for (const channel of channels) {
        void supabase.removeChannel(channel);
      }
    },
  };
}

export function isConversationRealtimeEnabled(): boolean {
  return true;
}
