import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationDeliveryStats = {
  delivery: {
    total: number;
    sent: number;
    failed: number;
    queued: number;
    byChannel: Record<string, { sent: number; failed: number; queued: number }>;
  };
  notifications: {
    total: number;
    unread: number;
    read: number;
  };
  push: {
    subscriptions: number;
    platforms: Record<string, number>;
  };
  periodDays: number;
};

export async function getNotificationDeliveryStats(
  periodDays = 30,
): Promise<NotificationDeliveryStats> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: deliveryTotal },
    { data: deliveryRows },
    { count: notificationTotal },
    { count: unreadTotal },
    { count: readTotal },
    { count: subscriptionTotal },
    { data: subscriptionPlatforms },
  ] = await Promise.all([
    admin
      .from("notification_delivery_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    admin
      .from("notification_delivery_log")
      .select("channel, status")
      .gte("created_at", since),
    admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false)
      .gte("created_at", since),
    admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", true)
      .gte("created_at", since),
    admin.from("push_subscriptions").select("id", { count: "exact", head: true }),
    admin.from("push_subscriptions").select("platform"),
  ]);

  const byChannel: Record<string, { sent: number; failed: number; queued: number }> = {};
  let sent = 0;
  let failed = 0;
  let queued = 0;

  for (const row of deliveryRows ?? []) {
    const channel = row.channel ?? "unknown";
    if (!byChannel[channel]) {
      byChannel[channel] = { sent: 0, failed: 0, queued: 0 };
    }
    if (row.status === "sent") {
      sent += 1;
      byChannel[channel].sent += 1;
    } else if (row.status === "failed") {
      failed += 1;
      byChannel[channel].failed += 1;
    } else {
      queued += 1;
      byChannel[channel].queued += 1;
    }
  }

  const platforms: Record<string, number> = {};
  for (const row of subscriptionPlatforms ?? []) {
    const platform = row.platform ?? "web";
    platforms[platform] = (platforms[platform] ?? 0) + 1;
  }

  return {
    delivery: {
      total: deliveryTotal ?? 0,
      sent,
      failed,
      queued,
      byChannel,
    },
    notifications: {
      total: notificationTotal ?? 0,
      unread: unreadTotal ?? 0,
      read: readTotal ?? 0,
    },
    push: {
      subscriptions: subscriptionTotal ?? 0,
      platforms,
    },
    periodDays,
  };
}
