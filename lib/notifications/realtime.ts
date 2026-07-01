import { tryCreateClient } from "@/lib/supabase/client";
import type { RealtimeChannel, REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";

export type NotificationRealtimeEvent = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  record: Record<string, unknown>;
};

export type NotificationRealtimeStatus = REALTIME_SUBSCRIBE_STATES;

type SubscribeOptions = {
  onChange: (event: NotificationRealtimeEvent) => void;
  onStatus?: (status: NotificationRealtimeStatus) => void;
};

export function subscribeToUserNotifications(
  userId: string,
  options: SubscribeOptions | ((event: NotificationRealtimeEvent) => void),
): RealtimeChannel | null {
  const supabase = tryCreateClient();
  if (!supabase) {
    return null;
  }

  const onChange = typeof options === "function" ? options : options.onChange;
  const onStatus = typeof options === "function" ? undefined : options.onStatus;

  return supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onChange({ eventType: "INSERT", record: payload.new as Record<string, unknown> });
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onChange({ eventType: "UPDATE", record: payload.new as Record<string, unknown> });
      },
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onChange({ eventType: "DELETE", record: payload.old as Record<string, unknown> });
      },
    )
    .subscribe((status) => {
      onStatus?.(status);
    });
}

export function removeNotificationChannel(channel: RealtimeChannel): void {
  const supabase = tryCreateClient();
  if (!supabase) return;
  void supabase.removeChannel(channel);
}
