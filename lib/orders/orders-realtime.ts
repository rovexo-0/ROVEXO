/**
 * Orders list live transport — buyer + seller order rows (Realtime Certification v1.1).
 * Delivers row payloads for in-place UI patch — never router.refresh / reload.
 */
import { tryCreateClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type OrdersRealtimeRow = Record<string, unknown> & {
  id?: string;
  status?: string;
  buyer_id?: string;
  seller_id?: string;
  updated_at?: string;
};

export type OrdersRealtimeSubscription = {
  unsubscribe: () => void;
};

export function subscribeOrdersRealtime(
  userId: string,
  onChange: (row: OrdersRealtimeRow) => void,
): OrdersRealtimeSubscription {
  const supabase = tryCreateClient();
  if (!supabase || !userId) {
    return { unsubscribe() {} };
  }

  const channels: RealtimeChannel[] = [];
  let debounce: ReturnType<typeof setTimeout> | null = null;
  let pending: OrdersRealtimeRow | null = null;

  const schedule = (row: OrdersRealtimeRow) => {
    pending = row;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      debounce = null;
      if (pending) onChange(pending);
      pending = null;
    }, 50);
  };

  const buyer = supabase
    .channel(`orders-rt-buyer:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `buyer_id=eq.${userId}`,
      },
      (payload) => {
        schedule((payload.new ?? payload.old ?? {}) as OrdersRealtimeRow);
      },
    )
    .subscribe();
  channels.push(buyer);

  const seller = supabase
    .channel(`orders-rt-seller:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `seller_id=eq.${userId}`,
      },
      (payload) => {
        schedule((payload.new ?? payload.old ?? {}) as OrdersRealtimeRow);
      },
    )
    .subscribe();
  channels.push(seller);

  return {
    unsubscribe() {
      if (debounce) clearTimeout(debounce);
      for (const channel of channels) {
        void supabase.removeChannel(channel);
      }
    },
  };
}
