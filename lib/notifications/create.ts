import { createAdminClient } from "@/lib/supabase/admin";

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
    | "system";
  title: string;
  subtitle: string;
  href?: string;
  detail?: string;
  avatarUrl?: string;
  avatarName?: string;
};

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    subtitle: input.subtitle,
    href: input.href,
    detail: input.detail,
    avatar_url: input.avatarUrl,
    avatar_name: input.avatarName,
    read: false,
  });
}
