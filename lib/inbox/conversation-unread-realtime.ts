import { tryCreateClient } from "@/lib/supabase/client";
import type { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

export type ConversationUnreadRealtimeStatus = REALTIME_SUBSCRIBE_STATES;

type SubscribeOptions = {
  onChange: () => void;
  onStatus?: (status: ConversationUnreadRealtimeStatus) => void;
};

/**
 * Realtime conversation unread bumps for Inbox bottom-nav badge (DEFECT #007).
 * Complements notifications channel — covers message unread when notify insert is skipped.
 */
export function subscribeToUserConversationUnread(
  userId: string,
  options: SubscribeOptions,
): { buyer: RealtimeChannel | null; seller: RealtimeChannel | null } {
  const supabase = tryCreateClient();
  if (!supabase) {
    return { buyer: null, seller: null };
  }

  const attach = (role: "buyer" | "seller", column: "buyer_id" | "seller_id") =>
    supabase
      .channel(`conversations-unread:${role}:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `${column}=eq.${userId}`,
        },
        () => {
          options.onChange();
        },
      )
      .subscribe((status) => {
        options.onStatus?.(status);
      });

  return {
    buyer: attach("buyer", "buyer_id"),
    seller: attach("seller", "seller_id"),
  };
}

export function removeConversationUnreadChannels(channels: {
  buyer: RealtimeChannel | null;
  seller: RealtimeChannel | null;
}): void {
  const supabase = tryCreateClient();
  if (!supabase) return;
  if (channels.buyer) void supabase.removeChannel(channels.buyer);
  if (channels.seller) void supabase.removeChannel(channels.seller);
}
