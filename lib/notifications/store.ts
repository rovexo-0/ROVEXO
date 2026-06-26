import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types/database";
import type { Notification, NotificationIcon, NotificationPreferences, NotificationSettings } from "@/lib/notifications/types";

function notificationIcon(type: Tables<"notifications">["type"]): NotificationIcon {
  switch (type) {
    case "message":
      return "message";
    case "order":
      return "order";
    case "offer":
      return "offer";
    case "review":
      return "review";
    case "payment":
      return "payment";
    case "follower":
      return "follower";
    case "moderation":
      return "moderation";
    case "promotion_expired":
      return "promotion";
    case "saved_item_sold":
    case "price_reduced":
      return "product";
    default:
      return "system";
  }
}

function mapNotification(row: Tables<"notifications">): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    subtitle: row.subtitle,
    href: row.href,
    read: row.read,
    avatarUrl: row.avatar_url,
    avatarName: row.avatar_name ?? undefined,
    detail: row.detail ?? undefined,
    createdAt: row.created_at,
    icon: notificationIcon(row.type),
  };
}

function mapSettings(row: Tables<"notification_settings">): NotificationSettings {
  return {
    pushEnabled: row.push_enabled,
    browserPush: row.browser_push ?? true,
    messages: row.messages,
    orders: row.orders,
    offers: row.offers,
    reviews: row.reviews,
    promotions: row.promotions,
    marketing: row.marketing,
    system: row.system,
    emailMessages: row.email_messages,
    emailOrders: row.email_orders,
    emailPromotions: row.email_promotions,
    emailMarketing: row.email_marketing,
    quietHoursEnabled: row.quiet_hours_enabled,
    quietHoursStart: row.quiet_hours_start.slice(0, 5),
    quietHoursEnd: row.quiet_hours_end.slice(0, 5),
    sound: row.sound,
    vibration: row.vibration,
  };
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapNotification);
}

export async function getNotificationById(
  id: string,
  userId: string,
): Promise<Notification | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  return data ? mapNotification(data) : null;
}

export async function markNotificationsRead(userId: string, ids: string[]): Promise<void> {
  if (!ids.length) {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .in("id", ids);
}

export async function deleteNotifications(userId: string, ids: string[]): Promise<void> {
  if (!ids.length) {
    return;
  }

  const supabase = await createClient();
  await supabase.from("notifications").delete().eq("user_id", userId).in("id", ids);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}

export async function deleteAllReadNotifications(userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notifications").delete().eq("user_id", userId).eq("read", true);
}

function mapPreferences(row: Tables<"notification_preferences">): NotificationPreferences {
  return {
    orders: row.orders,
    messages: row.messages,
    payments: row.payments,
    support: row.support,
    marketing: row.marketing,
    security: row.security,
    business: row.business,
    ai: row.ai,
  };
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return data ? mapPreferences(data) : null;
}

export async function updateNotificationPreferences(
  userId: string,
  patch: Partial<NotificationPreferences>,
): Promise<NotificationPreferences | null> {
  const supabase = await createClient();
  const update: Partial<Tables<"notification_preferences">> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.orders !== undefined) update.orders = patch.orders;
  if (patch.messages !== undefined) update.messages = patch.messages;
  if (patch.payments !== undefined) update.payments = patch.payments;
  if (patch.support !== undefined) update.support = patch.support;
  if (patch.marketing !== undefined) update.marketing = patch.marketing;
  if (patch.security !== undefined) update.security = patch.security;
  if (patch.business !== undefined) update.business = patch.business;
  if (patch.ai !== undefined) update.ai = patch.ai;

  await supabase.from("notification_preferences").upsert({
    user_id: userId,
    ...update,
  });

  return getNotificationPreferences(userId);
}

export async function getNotificationSettings(
  userId: string,
): Promise<NotificationSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return mapSettings(data);
}

export async function updateNotificationSettings(
  userId: string,
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings | null> {
  const supabase = await createClient();
  const update: Record<string, boolean | string | undefined> = {};

  if (patch.pushEnabled !== undefined) update.push_enabled = patch.pushEnabled;
  if (patch.browserPush !== undefined) update.browser_push = patch.browserPush;
  if (patch.messages !== undefined) update.messages = patch.messages;
  if (patch.orders !== undefined) update.orders = patch.orders;
  if (patch.offers !== undefined) update.offers = patch.offers;
  if (patch.reviews !== undefined) update.reviews = patch.reviews;
  if (patch.promotions !== undefined) update.promotions = patch.promotions;
  if (patch.marketing !== undefined) update.marketing = patch.marketing;
  if (patch.system !== undefined) update.system = patch.system;
  if (patch.emailMessages !== undefined) update.email_messages = patch.emailMessages;
  if (patch.emailOrders !== undefined) update.email_orders = patch.emailOrders;
  if (patch.emailPromotions !== undefined) update.email_promotions = patch.emailPromotions;
  if (patch.emailMarketing !== undefined) update.email_marketing = patch.emailMarketing;
  if (patch.quietHoursEnabled !== undefined) update.quiet_hours_enabled = patch.quietHoursEnabled;
  if (patch.quietHoursStart !== undefined) update.quiet_hours_start = patch.quietHoursStart;
  if (patch.quietHoursEnd !== undefined) update.quiet_hours_end = patch.quietHoursEnd;
  if (patch.sound !== undefined) update.sound = patch.sound;
  if (patch.vibration !== undefined) update.vibration = patch.vibration;

  if (Object.keys(update).length) {
    await supabase
      .from("notification_settings")
      .update(update as Tables<"notification_settings">)
      .eq("user_id", userId);
  }

  return getNotificationSettings(userId);
}
