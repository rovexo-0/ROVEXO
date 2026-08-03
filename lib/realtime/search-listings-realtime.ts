/**
 * Search listing visibility realtime — publish / pause / relist / delete.
 * Triggers results refresh without page reload (Realtime Certification v1.0).
 */
import { tryCreateClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type SearchListingsRealtimeSubscription = {
  unsubscribe: () => void;
};

export function subscribeSearchListingsRealtime(
  onChange: () => void,
): SearchListingsRealtimeSubscription {
  const supabase = tryCreateClient();
  if (!supabase) {
    return { unsubscribe() {} };
  }

  let debounce: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      debounce = null;
      onChange();
    }, 250);
  };

  const channel: RealtimeChannel = supabase
    .channel(`search-listings-rt:${Date.now()}`)
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

  return {
    unsubscribe() {
      if (debounce) clearTimeout(debounce);
      void supabase.removeChannel(channel);
    },
  };
}
