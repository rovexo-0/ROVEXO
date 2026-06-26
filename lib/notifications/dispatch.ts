import { createNotification } from "@/lib/notifications/create";
import { deliverNotificationChannels } from "@/lib/notifications/deliver";
import {
  buildNotificationGroupKey,
  resolveNotificationPriority,
} from "@/lib/notifications/grouping";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PushPriority } from "@/lib/push/vapid";

type DispatchInput = {
  userId: string;
  type:
    | "message"
    | "order"
    | "offer"
    | "review"
    | "payment"
    | "follower"
    | "moderation"
    | "promotion_expired"
    | "saved_item_sold"
    | "price_reduced"
    | "saved_search_match"
    | "system";
  title: string;
  subtitle: string;
  href?: string;
  detail?: string;
  email?: { to: string; subject: string; body: string };
  priority?: PushPriority;
  silent?: boolean;
  groupKey?: string;
};

export async function dispatchNotification(input: DispatchInput): Promise<void> {
  const admin = createAdminClient();
  const [{ data: settings }, { data: userSettings }] = await Promise.all([
    admin
      .from("notification_settings")
      .select("messages, orders, offers, reviews, system, push_enabled")
      .eq("user_id", input.userId)
      .maybeSingle(),
    admin.from("user_settings").select("email_notifications").eq("user_id", input.userId).maybeSingle(),
  ]);

  const channelAllowed = (() => {
    switch (input.type) {
      case "message":
        return settings?.messages ?? true;
      case "order":
        return settings?.orders ?? true;
      case "offer":
        return settings?.offers ?? true;
      case "review":
        return settings?.reviews ?? true;
      case "payment":
      case "follower":
      case "moderation":
      case "promotion_expired":
      case "saved_search_match":
        return settings?.system ?? true;
      default:
        return true;
    }
  })();

  if (!channelAllowed) {
    return;
  }

  const priority = input.priority ?? resolveNotificationPriority(input.type);
  const groupKey =
    input.groupKey ??
    buildNotificationGroupKey({ userId: input.userId, type: input.type, href: input.href });

  const notificationId = await createNotification({
    userId: input.userId,
    type: input.type,
    title: input.title,
    subtitle: input.subtitle,
    href: input.href,
    detail: input.detail,
    priority,
    silent: input.silent,
    groupKey,
  });

  if (!notificationId) {
    return;
  }

  await deliverNotificationChannels({
    userId: input.userId,
    notificationId,
    type: input.type,
    eventType: input.type,
    title: input.title,
    subtitle: input.subtitle,
    href: input.href,
    priority,
    silent: input.silent,
    groupKey,
    email:
      input.email && (userSettings?.email_notifications ?? true) ? input.email : undefined,
    skipPush: !(settings?.push_enabled ?? false),
  });
}
