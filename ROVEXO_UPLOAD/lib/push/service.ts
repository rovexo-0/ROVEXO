import { createAdminClient } from "@/lib/supabase/admin";
import { configureWebPush, isPushConfigured, webpush, type PushPriority } from "@/lib/push/vapid";
import { isWithinQuietHours } from "@/lib/notifications/quiet-hours";
import { checkRateLimit } from "@/lib/api/rate-limit";

export type PushPayload = {
  title: string;
  body: string;
  href?: string;
  notificationId?: string;
  eventType?: string;
  priority?: PushPriority;
  silent?: boolean;
  groupKey?: string;
  sound?: boolean;
  vibration?: boolean;
};

export type PushSendResult = {
  sent: number;
  failed: number;
  skipped: number;
};

const STALE_STATUS_CODES = new Set([404, 410]);
const MAX_PUSH_PER_USER_PER_MINUTE = 30;

function computeRetryAt(retryCount: number): string {
  const delayMinutes = Math.min(60, 5 * 2 ** retryCount);
  return new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
}

export async function sendPushNotification(
  userId: string,
  payload: PushPayload,
): Promise<PushSendResult> {
  const result: PushSendResult = { sent: 0, failed: 0, skipped: 0 };
  const admin = createAdminClient();

  const rateLimit = await checkRateLimit(`push:${userId}`, MAX_PUSH_PER_USER_PER_MINUTE, 60_000);
  if (!rateLimit.allowed) {
    result.skipped += 1;
    return result;
  }

  const { data: settings } = await admin
    .from("notification_settings")
    .select(
      "push_enabled, browser_push, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, sound, vibration",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (!(settings?.push_enabled ?? false)) {
    return result;
  }

  const priority = payload.priority ?? "normal";
  const isEmergency = priority === "emergency";

  if (
    !isEmergency &&
    isWithinQuietHours({
      enabled: settings?.quiet_hours_enabled ?? false,
      start: (settings?.quiet_hours_start ?? "22:00").slice(0, 5),
      end: (settings?.quiet_hours_end ?? "07:00").slice(0, 5),
    })
  ) {
    result.skipped += 1;
    return result;
  }

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, platform")
    .eq("user_id", userId);

  if (!subscriptions?.length) {
    return result;
  }

  const sound = payload.sound ?? settings?.sound ?? true;
  const vibration = payload.vibration ?? settings?.vibration ?? true;
  const silent = payload.silent ?? false;

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    href: payload.href ?? "/notifications",
    tag: payload.groupKey ?? payload.notificationId ?? undefined,
    silent,
    priority,
    sound,
    vibration,
    notificationId: payload.notificationId,
  });

  const pushReady = isPushConfigured() && configureWebPush();

  for (const subscription of subscriptions) {
    if (subscription.platform === "web" && !(settings?.browser_push ?? true)) {
      result.skipped += 1;
      continue;
    }

    const logBase = {
      user_id: userId,
      channel: "push",
      event_type: payload.eventType ?? "message",
      notification_id: payload.notificationId ?? null,
      priority,
      silent,
      group_key: payload.groupKey ?? null,
      payload: {
        endpoint: subscription.endpoint,
        platform: subscription.platform,
        title: payload.title,
        body: payload.body,
        href: payload.href ?? "",
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    if (!pushReady) {
      await admin.from("notification_delivery_log").insert({
        ...logBase,
        status: "failed",
        error_message: "Push not configured (missing VAPID keys)",
        retry_count: 0,
        next_retry_at: computeRetryAt(0),
      });
      result.failed += 1;
      continue;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        pushPayload,
        {
          urgency: priority === "emergency" || priority === "high" ? "high" : "normal",
          TTL: priority === "emergency" ? 86400 : 3600,
        },
      );

      await admin.from("notification_delivery_log").insert({
        ...logBase,
        status: "sent",
        delivered_at: new Date().toISOString(),
      });
      result.sent += 1;
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      const errorMessage = error instanceof Error ? error.message : "Push delivery failed";

      if (statusCode && STALE_STATUS_CODES.has(statusCode)) {
        await admin.from("push_subscriptions").delete().eq("id", subscription.id);
      }

      await admin.from("notification_delivery_log").insert({
        ...logBase,
        status: "failed",
        retry_count: 0,
        next_retry_at: computeRetryAt(0),
        error_message: errorMessage,
      });
      result.failed += 1;
    }
  }

  return result;
}

export async function retryPushDelivery(logId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: log } = await admin
    .from("notification_delivery_log")
    .select("*")
    .eq("id", logId)
    .eq("channel", "push")
    .eq("status", "failed")
    .maybeSingle();

  if (!log) return false;

  const payload = log.payload as {
    endpoint?: string;
    platform?: string;
    title?: string;
    body?: string;
    href?: string;
    p256dh?: string;
    auth?: string;
  };

  if (!payload.endpoint || !payload.p256dh || !payload.auth) {
    return false;
  }

  if (!isPushConfigured() || !configureWebPush()) {
    return false;
  }

  const pushPayload = JSON.stringify({
    title: payload.title ?? "ROVEXO",
    body: payload.body ?? "",
    href: payload.href ?? "/notifications",
    tag: log.group_key ?? log.notification_id ?? undefined,
    silent: log.silent ?? false,
    priority: log.priority ?? "normal",
    notificationId: log.notification_id ?? undefined,
  });

  try {
    await webpush.sendNotification(
      {
        endpoint: payload.endpoint,
        keys: { p256dh: payload.p256dh, auth: payload.auth },
      },
      pushPayload,
    );

    await admin
      .from("notification_delivery_log")
      .update({
        status: "sent",
        delivered_at: new Date().toISOString(),
        error_message: null,
        next_retry_at: null,
      })
      .eq("id", logId);

    return true;
  } catch (error: unknown) {
    const retryCount = (log.retry_count ?? 0) + 1;
    const errorMessage = error instanceof Error ? error.message : "Push retry failed";

    if (retryCount >= 5) {
      await admin
        .from("notification_delivery_log")
        .update({
          retry_count: retryCount,
          error_message: errorMessage,
          next_retry_at: null,
        })
        .eq("id", logId);
      return false;
    }

    await admin
      .from("notification_delivery_log")
      .update({
        retry_count: retryCount,
        next_retry_at: computeRetryAt(retryCount),
        error_message: errorMessage,
      })
      .eq("id", logId);

    return false;
  }
}
