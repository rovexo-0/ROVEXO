import { createClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/lib/supabase/types/database";
import type {
  Notification,
  NotificationIcon,
  NotificationPreferences,
  NotificationSettings,
} from "@/lib/notifications/types";
import { enrichNotificationProductMedia } from "@/lib/notifications/enrich-product-media";
import { recoverNotificationHref } from "@/lib/notifications/routing";
import {
  applyNotificationEnginePatch,
  createDefaultNotificationEngineState,
  engineToLegacyNotificationSettings,
  engineToNotificationPreferences,
  hydrateEngineFromLegacySettings,
  isNotificationChannelId,
  isNotificationTopicId,
  parseNotificationEngineState,
  type NotificationEngineState,
} from "@/lib/notifications/notification-engine-v1";

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
    case "moderation":
      return "moderation";
    case "promotion_expired":
      return "promotion";
    case "saved_item_sold":
    case "price_reduced":
    case "saved_search_match":
      return "product";
    default:
      return "system";
  }
}

function mapNotification(row: Tables<"notifications">): Notification {
  const type =
    row.type === "follower" ? ("system" as const) : (row.type as Notification["type"]);
  return {
    id: row.id,
    type,
    title: row.title,
    subtitle: row.subtitle,
    href: recoverNotificationHref(row.href),
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

function resolveEngineFromRow(row: Tables<"notification_settings"> | null): NotificationEngineState {
  if (!row) return createDefaultNotificationEngineState();
  const empty =
    !row.engine_v1 ||
    (typeof row.engine_v1 === "object" &&
      !Array.isArray(row.engine_v1) &&
      Object.keys(row.engine_v1 as object).length === 0);
  if (empty) {
    return hydrateEngineFromLegacySettings(mapSettings(row));
  }
  return parseNotificationEngineState(row.engine_v1);
}

export async function listNotifications(
  userId: string,
  client?: Awaited<ReturnType<typeof createClient>>,
): Promise<Notification[]> {
  const supabase = client ?? (await createClient());
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const mapped = (data ?? []).map(mapNotification);
  return enrichNotificationProductMedia(mapped);
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

export async function markAllNotificationsRead(
  userId: string,
  client?: Awaited<ReturnType<typeof createClient>>,
): Promise<void> {
  const supabase = client ?? (await createClient());
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
    security: true,
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
    security: true,
  };

  if (patch.orders !== undefined) update.orders = patch.orders;
  if (patch.messages !== undefined) update.messages = patch.messages;
  if (patch.payments !== undefined) update.payments = patch.payments;
  if (patch.support !== undefined) update.support = patch.support;
  if (patch.marketing !== undefined) update.marketing = patch.marketing;
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

const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  browserPush: true,
  messages: true,
  orders: true,
  offers: true,
  reviews: true,
  promotions: true,
  marketing: false,
  system: true,
  emailMessages: true,
  emailOrders: true,
  emailPromotions: false,
  emailMarketing: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  sound: true,
  vibration: true,
};

export async function getNotificationEngine(
  userId: string,
): Promise<{ settings: NotificationSettings; engine: NotificationEngineState }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    const engine = createDefaultNotificationEngineState();
    return {
      settings: { ...DEFAULT_SETTINGS, ...engineToLegacyNotificationSettings(engine) },
      engine,
    };
  }

  return {
    settings: mapSettings(data),
    engine: resolveEngineFromRow(data),
  };
}

async function persistEngineState(
  userId: string,
  engine: NotificationEngineState,
  baseSettings: NotificationSettings | null,
): Promise<{ settings: NotificationSettings; engine: NotificationEngineState }> {
  const supabase = await createClient();
  const legacy = engineToLegacyNotificationSettings(engine, baseSettings);
  const prefs = engineToNotificationPreferences(engine);

  await supabase.from("notification_settings").upsert({
    user_id: userId,
    push_enabled: legacy.pushEnabled ?? true,
    browser_push: legacy.browserPush ?? true,
    messages: legacy.messages ?? true,
    orders: legacy.orders ?? true,
    offers: legacy.offers ?? true,
    reviews: legacy.reviews ?? true,
    promotions: legacy.promotions ?? true,
    marketing: legacy.marketing ?? false,
    system: legacy.system ?? true,
    email_messages: legacy.emailMessages ?? true,
    email_orders: legacy.emailOrders ?? true,
    email_promotions: legacy.emailPromotions ?? false,
    email_marketing: legacy.emailMarketing ?? false,
    quiet_hours_enabled: legacy.quietHoursEnabled ?? false,
    quiet_hours_start: legacy.quietHoursStart ?? "22:00",
    quiet_hours_end: legacy.quietHoursEnd ?? "07:00",
    sound: legacy.sound ?? true,
    vibration: legacy.vibration ?? true,
    engine_v1: engine as unknown as Json,
    updated_at: new Date().toISOString(),
  });

  await updateNotificationPreferences(userId, prefs);

  return getNotificationEngine(userId);
}

export async function updateNotificationEngine(
  userId: string,
  patch: {
    topicId?: string;
    channelId?: string;
    enabled?: boolean;
    engine?: unknown;
  },
): Promise<{ settings: NotificationSettings; engine: NotificationEngineState }> {
  const current = await getNotificationEngine(userId);
  let nextEngine = current.engine;

  if (patch.engine) {
    nextEngine = parseNotificationEngineState(patch.engine);
  } else {
    const topicId =
      patch.topicId && isNotificationTopicId(patch.topicId) ? patch.topicId : undefined;
    const channelId =
      patch.channelId && isNotificationChannelId(patch.channelId) ? patch.channelId : undefined;
    nextEngine = applyNotificationEnginePatch(current.engine, {
      topicId,
      channelId,
      enabled: patch.enabled,
    });
  }

  return persistEngineState(userId, nextEngine, current.settings);
}

export async function updateNotificationSettings(
  userId: string,
  patch: Partial<NotificationSettings> & {
    topicId?: string;
    channelId?: string;
    enabled?: boolean;
    engine?: unknown;
  },
): Promise<NotificationSettings | null> {
  if (patch.topicId || patch.channelId || patch.engine) {
    const result = await updateNotificationEngine(userId, patch);
    return result.settings;
  }

  const supabase = await createClient();
  const current = await getNotificationEngine(userId);
  const update: Record<string, boolean | string | Json | undefined> = {};

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

  let engine = current.engine;
  if (patch.pushEnabled !== undefined) {
    engine = { ...engine, channels: { ...engine.channels, push: patch.pushEnabled } };
  }
  if (patch.browserPush !== undefined) {
    engine = { ...engine, channels: { ...engine.channels, browser: patch.browserPush } };
  }
  if (
    patch.emailMessages !== undefined ||
    patch.emailOrders !== undefined ||
    patch.emailPromotions !== undefined ||
    patch.emailMarketing !== undefined
  ) {
    const emailOn =
      (patch.emailMessages ?? current.settings.emailMessages) ||
      (patch.emailOrders ?? current.settings.emailOrders) ||
      (patch.emailPromotions ?? current.settings.emailPromotions) ||
      (patch.emailMarketing ?? current.settings.emailMarketing);
    engine = { ...engine, channels: { ...engine.channels, email: emailOn === true } };
  }
  update.engine_v1 = engine as unknown as Json;

  if (Object.keys(update).length) {
    await supabase.from("notification_settings").upsert({
      user_id: userId,
      push_enabled: patch.pushEnabled ?? current.settings.pushEnabled,
      browser_push: patch.browserPush ?? current.settings.browserPush,
      messages: patch.messages ?? current.settings.messages,
      orders: patch.orders ?? current.settings.orders,
      offers: patch.offers ?? current.settings.offers,
      reviews: patch.reviews ?? current.settings.reviews,
      promotions: patch.promotions ?? current.settings.promotions,
      marketing: patch.marketing ?? current.settings.marketing,
      system: patch.system ?? current.settings.system,
      email_messages: patch.emailMessages ?? current.settings.emailMessages,
      email_orders: patch.emailOrders ?? current.settings.emailOrders,
      email_promotions: patch.emailPromotions ?? current.settings.emailPromotions,
      email_marketing: patch.emailMarketing ?? current.settings.emailMarketing,
      quiet_hours_enabled: patch.quietHoursEnabled ?? current.settings.quietHoursEnabled,
      quiet_hours_start: patch.quietHoursStart ?? current.settings.quietHoursStart,
      quiet_hours_end: patch.quietHoursEnd ?? current.settings.quietHoursEnd,
      sound: patch.sound ?? current.settings.sound,
      vibration: patch.vibration ?? current.settings.vibration,
      engine_v1: update.engine_v1,
      updated_at: new Date().toISOString(),
    });
    await updateNotificationPreferences(userId, engineToNotificationPreferences(engine));
  }

  return getNotificationSettings(userId);
}
