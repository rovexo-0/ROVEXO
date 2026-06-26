import { createAdminClient } from "@/lib/supabase/admin";
import type { PushPriority } from "@/lib/push/vapid";

type CreateNotificationInput = {
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
  avatarUrl?: string;
  avatarName?: string;
  priority?: PushPriority;
  silent?: boolean;
  groupKey?: string;
};

export async function createNotification(input: CreateNotificationInput): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("notifications")
    .insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      subtitle: input.subtitle,
      href: input.href,
      detail: input.detail,
      avatar_url: input.avatarUrl,
      avatar_name: input.avatarName,
      read: false,
      priority: input.priority ?? "normal",
      silent: input.silent ?? false,
      group_key: input.groupKey ?? null,
    })
    .select("id")
    .single();

  if (error) return null;
  return data.id;
}
