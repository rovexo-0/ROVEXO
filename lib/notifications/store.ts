import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types/database";
import type { Notification, NotificationIcon, NotificationSettings } from "@/lib/notifications/types";

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

  return {
    pushEnabled: data.push_enabled,
    messages: data.messages,
    orders: data.orders,
    offers: data.offers,
    reviews: data.reviews,
    system: data.system,
    quietHoursEnabled: data.quiet_hours_enabled,
    quietHoursStart: data.quiet_hours_start.slice(0, 5),
    quietHoursEnd: data.quiet_hours_end.slice(0, 5),
    sound: data.sound,
    vibration: data.vibration,
  };
}

export async function updateNotificationSettings(
  userId: string,
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings | null> {
  const supabase = await createClient();
  await supabase
    .from("notification_settings")
    .update({
      push_enabled: patch.pushEnabled,
      messages: patch.messages,
      orders: patch.orders,
      offers: patch.offers,
      reviews: patch.reviews,
      system: patch.system,
      quiet_hours_enabled: patch.quietHoursEnabled,
      quiet_hours_start: patch.quietHoursStart,
      quiet_hours_end: patch.quietHoursEnd,
      sound: patch.sound,
      vibration: patch.vibration,
    })
    .eq("user_id", userId);

  return getNotificationSettings(userId);
}
