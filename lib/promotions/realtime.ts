import { tryCreateClient } from "@/lib/supabase/client";
import type { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

export type PromotionRealtimeStatus = REALTIME_SUBSCRIBE_STATES;

type SubscribeOptions = {
  onChange: () => void;
  onStatus?: (status: PromotionRealtimeStatus) => void;
  sellerId?: string;
};

function attachTableListener(
  channel: RealtimeChannel,
  table: string,
  filter: string | undefined,
  onChange: () => void,
): RealtimeChannel {
  return channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table,
      ...(filter ? { filter } : {}),
    },
    () => {
      onChange();
    },
  );
}

/** Subscribe to promotion table changes for live UI refresh. */
export function subscribeToPromotionChanges(options: SubscribeOptions): RealtimeChannel | null {
  const supabase = tryCreateClient();
  if (!supabase) {
    return null;
  }

  const { onChange, onStatus, sellerId } = options;
  const channelName = sellerId ? `promotions:${sellerId}` : "promotions:global";
  const channel = supabase.channel(channelName);

  if (sellerId) {
    attachTableListener(channel, "listing_promotions", `seller_id=eq.${sellerId}`, onChange);
    attachTableListener(channel, "seller_promotions", `seller_id=eq.${sellerId}`, onChange);
    attachTableListener(channel, "products", `seller_id=eq.${sellerId}`, onChange);
  } else {
    attachTableListener(channel, "listing_promotions", undefined, onChange);
    attachTableListener(channel, "seller_promotions", undefined, onChange);
  }

  return channel.subscribe((status) => {
    onStatus?.(status);
  });
}

export function removePromotionChannel(channel: RealtimeChannel): void {
  const supabase = tryCreateClient();
  if (!supabase) return;
  void supabase.removeChannel(channel);
}
