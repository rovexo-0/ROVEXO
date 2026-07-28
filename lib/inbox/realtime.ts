/**
 * Inbox list realtime — live transport for Messages Hub list (COD SÂNGE).
 * Complements notification + unread channels. No focus polling required.
 */

import { tryCreateClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { UnreadCounter } from "@/lib/inbox/types";

export type InboxRealtimeEventType =
  | "message.created"
  | "message.updated"
  | "conversation.updated"
  | "notification.created"
  | "notification.updated"
  | "badge.updated"
  | "offer.updated"
  | "order.updated";

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

export type InboxRealtimeContext = {
  userId?: string | null;
};

function emit(handler: InboxRealtimeHandler, type: InboxRealtimeEventType, conversationId?: string) {
  handler({
    type,
    occurredAt: new Date().toISOString(),
    conversationId,
  });
}

/** Live inbox list transport — conversations + notifications for the signed-in user. */
export function subscribeInboxRealtime(
  handler: InboxRealtimeHandler,
  context: InboxRealtimeContext = {},
): InboxRealtimeSubscription {
  const supabase = tryCreateClient();
  if (!supabase) {
    return { unsubscribe() {} };
  }

  let cancelled = false;
  const channels: RealtimeChannel[] = [];
  let authSub: { unsubscribe: () => void } | null = null;

  const attachForUser = (userId: string) => {
    if (cancelled || !userId) return;

    const buyerConv = supabase
      .channel(`inbox-rt-conv-buyer:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `buyer_id=eq.${userId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { id?: string };
          emit(handler, "conversation.updated", row.id);
          emit(handler, "badge.updated", row.id);
        },
      )
      .subscribe();
    channels.push(buyerConv);

    const sellerConv = supabase
      .channel(`inbox-rt-conv-seller:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `seller_id=eq.${userId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as { id?: string };
          emit(handler, "conversation.updated", row.id);
          emit(handler, "badge.updated", row.id);
        },
      )
      .subscribe();
    channels.push(sellerConv);

    const notifications = supabase
      .channel(`inbox-rt-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          emit(handler, "notification.updated");
          emit(handler, "badge.updated");
        },
      )
      .subscribe();
    channels.push(notifications);
  };

  const provided = context.userId?.trim();
  if (provided) {
    attachForUser(provided);
  } else {
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const id = data.user?.id;
      if (id) attachForUser(id);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      const id = session?.user?.id;
      if (id && channels.length === 0) attachForUser(id);
    });
    authSub = data.subscription;
  }

  return {
    unsubscribe() {
      cancelled = true;
      authSub?.unsubscribe();
      for (const channel of channels) {
        void supabase.removeChannel(channel);
      }
    },
  };
}

export function isInboxRealtimeEnabled(): boolean {
  return true;
}
