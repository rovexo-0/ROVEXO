import { createAdminClient } from "@/lib/supabase/admin";
import { configureWebPush, isPushConfigured, webpush, type PushPriority } from "@/lib/push/vapid";
import { resolvePushNotificationHref } from "@/lib/push/resolve-push-notification-href-v1";
import { buildNotificationDeepLinkData } from "@/lib/notifications/notification-deep-link-v1";
import { isWithinQuietHours } from "@/lib/notifications/quiet-hours";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { logPushRtFlow } from "@/lib/push/push-realtime-flow-log-v1";
import {
  PUSH_DEVICE_TOKENS_TABLE,
  buildFcmDataPayload,
  fingerprintFcmToken,
  sendFcmHttpV1,
  toFcmSendInput,
  type FcmTransport,
} from "@/lib/push/fcm-http-v1";

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
  /** TEMP P0 device certification — optional correlation fields */
  conversationId?: string;
  offerId?: string;
  orderId?: string;
};

export type PushSendResult = {
  sent: number;
  failed: number;
  skipped: number;
};

export type SendPushNotificationDeps = {
  sendFcm?: FcmTransport;
};

const STALE_STATUS_CODES = new Set([404, 410]);
const MAX_PUSH_PER_USER_PER_MINUTE = 30;

function computeRetryAt(retryCount: number): string {
  const delayMinutes = Math.min(60, 5 * 2 ** retryCount);
  return new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
}

/** TEMP P0 — unique id for Server → Apple → SW correlation. */
function createPushTraceId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `pt_${crypto.randomUUID()}`;
  }
  return `pt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function readQueryId(href: string | undefined, key: string): string | null {
  if (!href) return null;
  try {
    const url = new URL(href, "https://www.rovexo.co.uk");
    const value = url.searchParams.get(key);
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

function serializeHeaders(headers: unknown): Record<string, string> | null {
  if (!headers || typeof headers !== "object") return null;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    out[key] = Array.isArray(value) ? value.map(String).join(", ") : String(value);
  }
  return out;
}

type AdminClient = ReturnType<typeof createAdminClient>;

type FcmDeviceTokenRow = {
  id: string;
  token: string;
  provider: string;
  platform: string;
};

async function loadFcmDeviceTokens(admin: AdminClient, userId: string): Promise<FcmDeviceTokenRow[]> {
  try {
    const { data, error } = await admin
      .from(PUSH_DEVICE_TOKENS_TABLE)
      .select("id, token, provider, platform")
      .eq("user_id", userId)
      .eq("provider", "fcm")
      .eq("platform", "android");
    if (error || !data) {
      if (error) {
        logPushRtFlow("PUSH_FAILED", { reason: "fcm_token_query_failed", userId });
      }
      return [];
    }
    return data.filter((row) => typeof row.token === "string" && row.token.length > 0);
  } catch {
    logPushRtFlow("PUSH_FAILED", { reason: "fcm_token_query_failed", userId });
    return [];
  }
}

async function deliverFcmDeviceTokens(input: {
  admin: AdminClient;
  userId: string;
  payload: PushPayload;
  deviceTokens: FcmDeviceTokenRow[];
  deepLink: ReturnType<typeof buildNotificationDeepLinkData>;
  conversationId: string | null;
  offerId: string | null;
  orderId: string | null;
  result: PushSendResult;
  sendFcm: FcmTransport;
}): Promise<void> {
  if (input.deviceTokens.length === 0) return;

  const loggedMissingCredential = { current: false };

  for (const device of input.deviceTokens) {
    const tokenFingerprint = fingerprintFcmToken(device.token);
    const pushTraceId = createPushTraceId();
    const data = buildFcmDataPayload({
      notificationId: input.deepLink.notificationId,
      type: input.deepLink.type,
      href: input.deepLink.href,
      conversationId: input.conversationId,
      offerId: input.offerId,
      orderId: input.orderId,
      pushTraceId,
    });

    const logBase = {
      user_id: input.userId,
      channel: "push",
      event_type: input.payload.eventType ?? "message",
      notification_id: input.payload.notificationId ?? null,
      priority: input.payload.priority ?? "normal",
      silent: input.payload.silent ?? false,
      group_key: input.payload.groupKey ?? null,
      payload: {
        transport: "fcm",
        provider: "fcm",
        platform: device.platform,
        tokenFingerprint,
        title: input.payload.title,
        body: input.payload.body,
        href: input.deepLink.href,
        pushTraceId,
      },
    };

    try {
      const outcome = await input.sendFcm(toFcmSendInput(device.token, input.payload, data));
      if (outcome.ok) {
        logPushRtFlow("PUSH_SENT", {
          transport: "fcm",
          tokenFingerprint,
          pushTraceId,
          userId: input.userId,
        });
        await input.admin.from("notification_delivery_log").insert({
          ...logBase,
          status: "sent",
          delivered_at: new Date().toISOString(),
        });
        input.result.sent += 1;
        continue;
      }

      if (outcome.reason === "fcm_credential_not_configured") {
        if (!loggedMissingCredential.current) {
          loggedMissingCredential.current = true;
          logPushRtFlow("PUSH_FAILED", {
            transport: "fcm",
            reason: "fcm_credential_not_configured",
            userId: input.userId,
          });
        }
        input.result.skipped += 1;
        continue;
      }

      logPushRtFlow("PUSH_FAILED", {
        transport: "fcm",
        reason: outcome.reason,
        stale: outcome.stale,
        tokenFingerprint,
        pushTraceId,
        userId: input.userId,
      });

      if (outcome.stale) {
        await input.admin.from(PUSH_DEVICE_TOKENS_TABLE).delete().eq("id", device.id);
      }

      await input.admin.from("notification_delivery_log").insert({
        ...logBase,
        status: "failed",
        retry_count: 0,
        next_retry_at: computeRetryAt(0),
        error_message: outcome.reason,
      });
      input.result.failed += 1;
    } catch {
      logPushRtFlow("PUSH_FAILED", {
        transport: "fcm",
        reason: "fcm_send_failed",
        tokenFingerprint,
        pushTraceId,
        userId: input.userId,
      });
      await input.admin.from("notification_delivery_log").insert({
        ...logBase,
        status: "failed",
        retry_count: 0,
        next_retry_at: computeRetryAt(0),
        error_message: "fcm_send_failed",
      });
      input.result.failed += 1;
    }
  }
}

export async function sendPushNotification(
  userId: string,
  payload: PushPayload,
  deps?: SendPushNotificationDeps,
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

  if (!(settings?.push_enabled ?? true)) {
    logPushRtFlow("SKIP_PUSH", { reason: "push_enabled_false", userId });
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

  const webSubscriptions = subscriptions ?? [];
  const deviceTokens = await loadFcmDeviceTokens(admin, userId);

  if (!webSubscriptions.length && deviceTokens.length === 0) {
    logPushRtFlow("DELIVERY_FAILED", { reason: "no_subscriptions", userId });
    return result;
  }

  const sound = payload.sound ?? settings?.sound ?? true;
  const vibration = payload.vibration ?? settings?.vibration ?? true;
  const silent = payload.silent ?? false;

  logPushRtFlow("DELIVERY_START", {
    userId,
    subscriptionCount: webSubscriptions.length,
    fcmTokenCount: deviceTokens.length,
    silent,
    priority,
    eventType: payload.eventType,
    platforms: webSubscriptions.map((s) => s.platform),
  });

  const resolvedHref = resolvePushNotificationHref(payload.href, {
    title: payload.title,
    subtitle: payload.body,
    type: payload.eventType,
  });

  const deepLink = buildNotificationDeepLinkData({
    href: resolvedHref,
    notificationId: payload.notificationId,
    type: payload.eventType,
    title: payload.title,
    body: payload.body,
  });

  const conversationId =
    payload.conversationId ??
    deepLink.destination.params?.conversationId ??
    readQueryId(deepLink.href, "conversationId");
  const offerId =
    payload.offerId ??
    deepLink.destination.params?.offerId ??
    deepLink.destination.params?.eventId ??
    readQueryId(deepLink.href, "offerId");
  const orderId =
    payload.orderId ??
    deepLink.destination.params?.orderId ??
    readQueryId(deepLink.href, "orderId");

  const buildPushData = (pushTraceId: string) => ({
    notificationId: deepLink.notificationId,
    type: deepLink.type,
    href: deepLink.href,
    destination: deepLink.destination,
    conversationId,
    offerId,
    orderId,
    pushTraceId,
  });

  // Chromium / FCM — title/body + canonical data (destination included; no PII).
  const buildChromiumPayload = (pushTraceId: string) => {
    const data = buildPushData(pushTraceId);
    return JSON.stringify({
      title: payload.title,
      body: payload.body,
      href: data.href,
      tag: payload.groupKey ?? payload.notificationId ?? undefined,
      silent,
      priority,
      sound,
      vibration,
      notificationId: data.notificationId,
      type: data.type,
      destination: data.destination,
      pushTraceId,
      data,
    });
  };

  const pushReady = isPushConfigured() && configureWebPush();

  for (const subscription of webSubscriptions) {
    if (subscription.platform === "web" && !(settings?.browser_push ?? true)) {
      result.skipped += 1;
      continue;
    }

    const isApple = /web\.push\.apple\.com/i.test(subscription.endpoint);
    const pushTraceId = createPushTraceId();
    const createdAt = new Date().toISOString();
    const browser =
      subscription.platform === "ios"
        ? "safari_ios_pwa"
        : subscription.platform === "android"
          ? "android"
          : isApple
            ? "safari_web_push"
            : /fcm\.googleapis\.com/i.test(subscription.endpoint)
              ? "chromium_fcm"
              : "web";

    // TEMP P0: Apple gets minimal payload only (title/body/tag/data). Chromium unchanged shape + data.
    const applePushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      tag: payload.groupKey ?? payload.notificationId ?? undefined,
      appleMinimal: true,
      data: buildPushData(pushTraceId),
    });
    const pushPayloadBody = isApple ? applePushPayload : buildChromiumPayload(pushTraceId);
    const urgency = priority === "emergency" || priority === "high" ? "high" : "normal";
    const TTL = priority === "emergency" ? 86400 : 3600;
    const topic = null;

    const traceBase = {
      pushTraceId,
      notificationId: payload.notificationId ?? null,
      conversationId,
      offerId,
      orderId,
      userId,
      subscriptionId: subscription.id,
      endpoint: subscription.endpoint,
      platform: subscription.platform,
      browser,
      createdAt,
    };

    // eslint-disable-next-line no-console -- TEMP P0 Apple device certification
    console.info("[PUSH_TRACE]", traceBase);
    logPushRtFlow("PUSH_TRACE", traceBase);

    const logBase = {
      user_id: userId,
      channel: "push",
      event_type: payload.eventType ?? "message",
      notification_id: payload.notificationId ?? null,
      priority,
      silent: isApple ? false : silent,
      group_key: payload.groupKey ?? null,
      payload: {
        endpoint: subscription.endpoint,
        platform: subscription.platform,
        title: payload.title,
        body: payload.body,
        href: deepLink.href,
        destination: deepLink.destination,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        appleMinimal: isApple,
        pushTraceId,
      },
    };

    if (!pushReady) {
      // eslint-disable-next-line no-console -- TEMP P0 Apple device certification
      console.info("[PUSH_FAILED]", {
        ...traceBase,
        statusCode: null,
        headers: null,
        body: "Push not configured (missing VAPID keys)",
        stack: null,
      });
      logPushRtFlow("PUSH_FAILED", {
        ...traceBase,
        reason: "vapid_not_configured",
      });
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

    // eslint-disable-next-line no-console -- TEMP P0 Apple device certification
    console.info("[PUSH_SEND]", {
      pushTraceId,
      endpoint: subscription.endpoint,
      platform: subscription.platform,
      payload: pushPayloadBody,
      headers: { urgency, TTL, topic },
      TTL,
      urgency,
      topic,
    });
    logPushRtFlow("PUSH_SEND", {
      pushTraceId,
      endpoint: subscription.endpoint,
      platform: subscription.platform,
      TTL,
      urgency,
      topic,
      apple: isApple,
    });

    try {
      const response = await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        pushPayloadBody,
        {
          urgency,
          TTL,
        },
      );

      const statusCode =
        typeof response === "object" && response && "statusCode" in response
          ? (response as { statusCode?: number }).statusCode
          : 201;
      const responseBody =
        typeof response === "object" && response && "body" in response
          ? String((response as { body?: string }).body ?? "")
          : "";
      const responseHeaders = serializeHeaders(
        typeof response === "object" && response && "headers" in response
          ? (response as { headers?: unknown }).headers
          : null,
      );

      // eslint-disable-next-line no-console -- TEMP P0 Apple device certification
      console.info("[PUSH_SENT]", {
        pushTraceId,
        statusCode,
        headers: responseHeaders,
        body: responseBody,
        endpoint: subscription.endpoint,
        platform: subscription.platform,
        subscriptionId: subscription.id,
        apple: isApple,
      });
      logPushRtFlow("PUSH_SENT", {
        pushTraceId,
        statusCode,
        headers: responseHeaders,
        body: responseBody,
        endpoint: subscription.endpoint,
        apple: isApple,
      });
      if (isApple) {
        logPushRtFlow("APPLE_RESPONSE", {
          pushTraceId,
          statusCode,
          headers: responseHeaders,
          body: responseBody,
          endpoint: subscription.endpoint,
          subscriptionId: subscription.id,
          platform: subscription.platform,
        });
      }

      await admin.from("notification_delivery_log").insert({
        ...logBase,
        status: "sent",
        delivered_at: new Date().toISOString(),
      });
      result.sent += 1;
    } catch (error: unknown) {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      const body = (error as { body?: string })?.body;
      const headers = serializeHeaders((error as { headers?: unknown })?.headers);
      const errorMessage = error instanceof Error ? error.message : "Push delivery failed";
      const stack = error instanceof Error ? error.stack ?? null : null;

      // eslint-disable-next-line no-console -- TEMP P0 Apple device certification
      console.info("[PUSH_FAILED]", {
        pushTraceId,
        statusCode: statusCode ?? null,
        headers,
        body: typeof body === "string" ? body : String(body ?? ""),
        stack,
        endpoint: subscription.endpoint,
        platform: subscription.platform,
        subscriptionId: subscription.id,
        apple: isApple,
        error: errorMessage,
      });
      logPushRtFlow("PUSH_FAILED", {
        pushTraceId,
        statusCode: statusCode ?? null,
        headers,
        body: typeof body === "string" ? body : String(body ?? ""),
        stack,
        endpoint: subscription.endpoint,
        apple: isApple,
        error: errorMessage,
      });
      if (isApple) {
        logPushRtFlow("APPLE_RESPONSE", {
          pushTraceId,
          statusCode: statusCode ?? null,
          headers,
          body: typeof body === "string" ? body : String(body ?? ""),
          endpoint: subscription.endpoint,
          subscriptionId: subscription.id,
          platform: subscription.platform,
          error: errorMessage,
        });
      }

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

  await deliverFcmDeviceTokens({
    admin,
    userId,
    payload,
    deviceTokens,
    deepLink,
    conversationId,
    offerId,
    orderId,
    result,
    sendFcm: deps?.sendFcm ?? sendFcmHttpV1,
  });

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
