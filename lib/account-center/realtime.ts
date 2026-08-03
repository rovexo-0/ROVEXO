import { tryCreateClient } from "@/lib/supabase/client";
import type { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

export type AccountHubRealtimeStatus = REALTIME_SUBSCRIBE_STATES;

type SubscribeOptions = {
  onChange: () => void;
  onStatus?: (status: AccountHubRealtimeStatus) => void;
};

/**
 * Account Hub / Wallet live stats.
 * One channel per table — multi-filter single channels drop events under load.
 */
export function subscribeToAccountHubStats(
  userId: string,
  options: SubscribeOptions,
): RealtimeChannel | null {
  const supabase = tryCreateClient();
  if (!supabase || !userId) {
    return null;
  }

  const { onChange, onStatus } = options;
  const channels: RealtimeChannel[] = [];

  const attach = (name: string, table: string, filter?: string) => {
    const channel = supabase.channel(name);
    const spec: {
      event: "*";
      schema: "public";
      table: string;
      filter?: string;
    } = {
      event: "*",
      schema: "public",
      table,
    };
    if (filter) {
      spec.filter = filter;
    }
    channel
      .on("postgres_changes", spec, () => {
        onChange();
      })
      .subscribe((status) => {
        onStatus?.(status);
      });
    channels.push(channel);
  };

  attach(`account-hub-products:${userId}`, "products", `seller_id=eq.${userId}`);
  /*
   * saved_items: RLS-scoped subscribe without server filter.
   * Filtered postgres_changes needs REPLICA IDENTITY FULL; RLS still limits
   * events to the caller's own rows.
   */
  attach(`account-hub-saved:${userId}`, "saved_items");
  attach(`account-hub-orders-buyer:${userId}`, "orders", `buyer_id=eq.${userId}`);
  attach(`account-hub-orders-seller:${userId}`, "orders", `seller_id=eq.${userId}`);
  attach(`account-hub-seller-profiles:${userId}`, "seller_profiles", `id=eq.${userId}`);
  attach(`account-hub-reviews:${userId}`, "reviews", `reviewee_id=eq.${userId}`);
  attach(`account-hub-wallets:${userId}`, "wallets", `user_id=eq.${userId}`);
  attach(`account-hub-wallet-tx:${userId}`, "wallet_transactions", `user_id=eq.${userId}`);

  /* Primary channel handle for teardown — removeAccountHubChannel walks topic prefix. */
  const primary = channels[0] ?? null;
  if (primary) {
    (primary as RealtimeChannel & { __rovexoAccountHubChannels?: RealtimeChannel[] }).__rovexoAccountHubChannels =
      channels;
  }
  return primary;
}

export function removeAccountHubChannel(channel: RealtimeChannel): void {
  const supabase = tryCreateClient();
  if (!supabase) return;
  const group =
    (channel as RealtimeChannel & { __rovexoAccountHubChannels?: RealtimeChannel[] })
      .__rovexoAccountHubChannels ?? [channel];
  for (const entry of group) {
    void supabase.removeChannel(entry);
  }
}
