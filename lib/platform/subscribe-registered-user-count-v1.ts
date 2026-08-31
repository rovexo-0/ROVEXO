"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { REGISTERED_USER_COUNT_V1, isCountableRegisteredProfile } from "@/lib/platform/registered-user-count-client-v1";

type SubscribeOptions = {
  onInsert: () => void;
  onSoftDelete: () => void;
  onRestore: () => void;
};

/**
 * Realtime deltas from canonical public.profiles — no polling, no COUNT(*).
 * INSERT of a valid profile → +1
 * Soft-delete / restore UPDATE → −1 / +1
 *
 * OPT-HP-LCP: Supabase client is loaded only when subscribe runs (not on Homepage module graph).
 */
export async function subscribeRegisteredUserCountAsync(
  options: SubscribeOptions,
): Promise<RealtimeChannel | null> {
  const { tryCreateClient } = await import("@/lib/supabase/client");
  const supabase = tryCreateClient();
  if (!supabase) return null;

  const channel = supabase
    .channel(REGISTERED_USER_COUNT_V1.realtimeChannel)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: REGISTERED_USER_COUNT_V1.realtimeTable,
      },
      (payload) => {
        const row = payload.new as {
          account_status?: string | null;
          deleted_at?: string | null;
          email?: string | null;
        };
        if (isCountableRegisteredProfile(row)) {
          options.onInsert();
        }
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: REGISTERED_USER_COUNT_V1.realtimeTable,
      },
      (payload) => {
        const prev = payload.old as {
          account_status?: string | null;
          deleted_at?: string | null;
          email?: string | null;
        };
        const next = payload.new as {
          account_status?: string | null;
          deleted_at?: string | null;
          email?: string | null;
        };
        const wasCountable = isCountableRegisteredProfile(prev);
        const isCountable = isCountableRegisteredProfile(next);
        if (wasCountable && !isCountable) options.onSoftDelete();
        if (!wasCountable && isCountable) options.onRestore();
      },
    )
    .subscribe();

  return channel;
}

/** @deprecated Prefer subscribeRegisteredUserCountAsync — sync path cannot load Supabase without pulling it into the Homepage graph. */
export function subscribeRegisteredUserCount(options: SubscribeOptions): RealtimeChannel | null {
  void subscribeRegisteredUserCountAsync(options);
  return null;
}

export function unsubscribeRegisteredUserCount(channel: RealtimeChannel | null): void {
  if (!channel) return;
  void import("@/lib/supabase/client").then(({ tryCreateClient }) => {
    const supabase = tryCreateClient();
    if (supabase) void supabase.removeChannel(channel);
  });
}
