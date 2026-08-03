/**
 * Following feed live transport — replaces interval polling (Realtime Certification v1.0).
 * products + user_follows → immediate feed refresh. No setInterval polling.
 */
import { tryCreateClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type FollowingFeedRealtimeSubscription = {
  unsubscribe: () => void;
};

export function subscribeFollowingFeedRealtime(
  viewerId: string,
  onChange: () => void,
): FollowingFeedRealtimeSubscription {
  const supabase = tryCreateClient();
  if (!supabase || !viewerId) {
    return { unsubscribe() {} };
  }

  const channels: RealtimeChannel[] = [];
  let debounce: ReturnType<typeof setTimeout> | null = null;

  const schedule = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      debounce = null;
      onChange();
    }, 200);
  };

  const follows = supabase
    .channel(`following-feed-follows:${viewerId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_follows",
        filter: `follower_id=eq.${viewerId}`,
      },
      () => schedule(),
    )
    .subscribe();
  channels.push(follows);

  // New listings / price drops from followed sellers land in products;
  // filter is broad — handler only refreshes the authenticated following feed.
  const products = supabase
    .channel(`following-feed-products:${viewerId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "products",
      },
      () => schedule(),
    )
    .subscribe();
  channels.push(products);

  return {
    unsubscribe() {
      if (debounce) clearTimeout(debounce);
      for (const channel of channels) {
        void supabase.removeChannel(channel);
      }
    },
  };
}
