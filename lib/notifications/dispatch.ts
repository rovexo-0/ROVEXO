import { createNotification } from "@/lib/notifications/create";
import { queueEmail } from "@/lib/email/service";
import { sendPushNotification } from "@/lib/push/service";
import { createAdminClient } from "@/lib/supabase/admin";

type DispatchInput = {
  userId: string;
  type:
    | "message"
    | "order"
    | "offer"
    | "review"
    | "saved_item_sold"
    | "price_reduced"
    | "system";
  title: string;
  subtitle: string;
  href?: string;
  detail?: string;
  email?: { to: string; subject: string; body: string };
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
      default:
        return true;
    }
  })();

  if (!channelAllowed) {
    return;
  }

  await createNotification({
    userId: input.userId,
    type: input.type,
    title: input.title,
    subtitle: input.subtitle,
    href: input.href,
    detail: input.detail,
  });

  if (input.email && (userSettings?.email_notifications ?? true)) {
    await queueEmail({
      to: input.email.to,
      subject: input.email.subject,
      body: input.email.body,
      template: input.type,
      metadata: { userId: input.userId, href: input.href ?? "" },
    });
  }

  if (settings?.push_enabled ?? false) {
    await sendPushNotification(input.userId, {
      title: input.title,
      body: input.subtitle,
      href: input.href,
    });
  }

  await admin.from("notification_delivery_log").insert({
    user_id: input.userId,
    channel: "in_app",
    event_type: input.type,
    status: "queued",
    payload: { title: input.title, href: input.href ?? "" },
  });
}
