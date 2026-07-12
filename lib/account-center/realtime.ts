import { tryCreateClient } from "@/lib/supabase/client";
import type { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

export type AccountHubRealtimeStatus = REALTIME_SUBSCRIBE_STATES;

type SubscribeOptions = {
  onChange: () => void;
  onStatus?: (status: AccountHubRealtimeStatus) => void;
};

function attachTableListener(
  channel: RealtimeChannel,
  table: string,
  filter: string,
  onChange: () => void,
): RealtimeChannel {
  return channel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table,
      filter,
    },
    () => {
      onChange();
    },
  );
}

export function subscribeToAccountHubStats(
  userId: string,
  options: SubscribeOptions,
): RealtimeChannel | null {
  const supabase = tryCreateClient();
  if (!supabase) {
    return null;
  }

  const { onChange, onStatus } = options;

  const channel = supabase.channel(`account-hub:${userId}`);

  attachTableListener(channel, "products", `seller_id=eq.${userId}`, onChange);
  attachTableListener(channel, "saved_items", `user_id=eq.${userId}`, onChange);
  attachTableListener(channel, "orders", `buyer_id=eq.${userId}`, onChange);
  attachTableListener(channel, "orders", `seller_id=eq.${userId}`, onChange);
  attachTableListener(channel, "seller_follows", `seller_id=eq.${userId}`, onChange);
  attachTableListener(channel, "seller_profiles", `id=eq.${userId}`, onChange);
  attachTableListener(channel, "reviews", `reviewee_id=eq.${userId}`, onChange);
  attachTableListener(channel, "wallets", `user_id=eq.${userId}`, onChange);
  attachTableListener(channel, "wallet_transactions", `user_id=eq.${userId}`, onChange);

  return channel.subscribe((status) => {
    onStatus?.(status);
  });
}

export function removeAccountHubChannel(channel: RealtimeChannel): void {
  const supabase = tryCreateClient();
  if (!supabase) return;
  void supabase.removeChannel(channel);
}
