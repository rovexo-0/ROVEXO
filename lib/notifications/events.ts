import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/types/database";
import { createNotification } from "@/lib/notifications/create";
import { deliverNotificationChannels } from "@/lib/notifications/deliver";
import {
  buildNotificationGroupKey,
  resolveNotificationPriority,
  shouldSendForegroundPush,
} from "@/lib/notifications/grouping";
import { resolveSmartNotificationHref } from "@/lib/notifications/routing";

type NotificationType = Tables<"notifications">["type"];

export type SmartNotificationEventType =
  | "new_order"
  | "order_shipped"
  | "order_delivered"
  | "refund"
  | "payment_received"
  | "payout"
  | "new_message"
  | "new_offer"
  | "saved_search_match"
  | "listing_sold"
  | "listing_expiring"
  | "support_reply"
  | "trust_verification"
  | "admin_announcement"
  | "business_lead"
  | "promotion";

type EmitSmartNotificationInput = {
  userId: string;
  eventType: SmartNotificationEventType;
  idempotencyKey: string;
  notificationType: NotificationType;
  title: string;
  subtitle: string;
  href?: string;
  detail?: string;
  avatarUrl?: string;
  avatarName?: string;
  payload?: Record<string, unknown>;
};

type PreferenceCategory =
  | "orders"
  | "messages"
  | "payments"
  | "support"
  | "marketing"
  | "security"
  | "business"
  | "ai";

function eventPreferenceCategory(eventType: SmartNotificationEventType): PreferenceCategory {
  switch (eventType) {
    case "new_order":
    case "order_shipped":
    case "order_delivered":
    case "refund":
    case "listing_sold":
    case "listing_expiring":
      return "orders";
    case "new_message":
    case "new_offer":
      return "messages";
    case "payment_received":
    case "payout":
      return "payments";
    case "support_reply":
      return "support";
    case "promotion":
    case "admin_announcement":
      return "marketing";
    case "trust_verification":
      return "security";
    case "business_lead":
      return "business";
    case "saved_search_match":
      return "ai";
  }
}

async function isPreferenceEnabled(
  userId: string,
  category: PreferenceCategory,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return true;
  return data[category] ?? true;
}

export async function emitSmartNotification(input: EmitSmartNotificationInput): Promise<boolean> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("notification_events")
    .select("id, notification_id")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (existing?.notification_id) {
    return false;
  }

  const category = eventPreferenceCategory(input.eventType);
  const allowed = await isPreferenceEnabled(input.userId, category);
  if (!allowed) {
    await admin.from("notification_events").upsert(
      {
        user_id: input.userId,
        event_type: input.eventType,
        idempotency_key: input.idempotencyKey,
        payload: (input.payload ?? {}) as import("@/lib/supabase/types/database").Json,
        processed_at: new Date().toISOString(),
      },
      { onConflict: "idempotency_key" },
    );
    return false;
  }

  const { error: eventError } = await admin
    .from("notification_events")
    .upsert(
      {
        user_id: input.userId,
        event_type: input.eventType,
        idempotency_key: input.idempotencyKey,
        payload: (input.payload ?? {}) as import("@/lib/supabase/types/database").Json,
      },
      { onConflict: "idempotency_key" },
    )
    .select("id")
    .maybeSingle();

  if (eventError && !existing) {
    return false;
  }

  const resolvedHref =
    input.href ??
    resolveSmartNotificationHref(input.eventType, {
      orderId: typeof input.payload?.orderId === "string" ? input.payload.orderId : undefined,
      offerId: typeof input.payload?.offerId === "string" ? input.payload.offerId : undefined,
      productId: typeof input.payload?.productId === "string" ? input.payload.productId : undefined,
      productSlug: typeof input.payload?.productSlug === "string" ? input.payload.productSlug : undefined,
      transactionId:
        typeof input.payload?.transactionId === "string" ? input.payload.transactionId : undefined,
      conversationId:
        typeof input.payload?.conversationId === "string" ? input.payload.conversationId : undefined,
    });

  const priority = resolveNotificationPriority(input.eventType);
  const groupKey = buildNotificationGroupKey({
    userId: input.userId,
    type: input.notificationType,
    href: resolvedHref,
  });
  const silent = !shouldSendForegroundPush(priority);

  const notificationId = await createNotification({
    userId: input.userId,
    type: input.notificationType,
    title: input.title,
    subtitle: input.subtitle,
    href: resolvedHref,
    detail: input.detail,
    avatarUrl: input.avatarUrl,
    avatarName: input.avatarName,
    priority,
    silent,
    groupKey,
  });

  if (!notificationId) {
    return false;
  }

  await admin
    .from("notification_events")
    .update({
      processed_at: new Date().toISOString(),
      notification_id: notificationId,
    })
    .eq("idempotency_key", input.idempotencyKey);

  const { data: settings } = await admin
    .from("notification_settings")
    .select("push_enabled")
    .eq("user_id", input.userId)
    .maybeSingle();

  await deliverNotificationChannels({
    userId: input.userId,
    notificationId,
    type: input.notificationType,
    eventType: input.eventType,
    title: input.title,
    subtitle: input.subtitle,
    href: resolvedHref,
    priority,
    silent,
    groupKey,
    skipPush: !(settings?.push_enabled ?? false),
  });

  return true;
}
