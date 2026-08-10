"use client";

import { tryCreateClient } from "@/lib/supabase/client";
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
 */
export function subscribeRegisteredUserCount(options: SubscribeOptions): RealtimeChannel | null {
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
        const was = isCountableRegisteredProfile(prev);
        const now = isCountableRegisteredProfile(next);
        if (was && !now) options.onSoftDelete();
        if (!was && now) options.onRestore();
      },
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: REGISTERED_USER_COUNT_V1.realtimeTable,
      },
      (payload) => {
        const row = payload.old as {
          account_status?: string | null;
          deleted_at?: string | null;
          email?: string | null;
        };
        if (isCountableRegisteredProfile(row)) {
          options.onSoftDelete();
        }
      },
    )
    .subscribe();

  return channel;
}

export function unsubscribeRegisteredUserCount(channel: RealtimeChannel | null): void {
  if (!channel) return;
  const supabase = tryCreateClient();
  if (supabase) {
    void supabase.removeChannel(channel);
  }
}
