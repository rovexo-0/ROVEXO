import { queueEmail } from "@/lib/email/service";
import { sendPushNotification } from "@/lib/push/service";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PushPriority } from "@/lib/push/vapid";

export type DeliverChannelsInput = {
  userId: string;
  notificationId: string;
  type: string;
  eventType: string;
  title: string;
  subtitle: string;
  href?: string;
  priority?: PushPriority;
  silent?: boolean;
  groupKey?: string;
  email?: { to: string; subject: string; body: string };
  skipPush?: boolean;
  skipEmail?: boolean;
};

export async function deliverNotificationChannels(input: DeliverChannelsInput): Promise<void> {
  const admin = createAdminClient();

  await admin.from("notification_delivery_log").insert({
    user_id: input.userId,
    channel: "in_app",
    event_type: input.eventType,
    status: "sent",
    notification_id: input.notificationId,
    priority: input.priority ?? "normal",
    silent: input.silent ?? false,
    group_key: input.groupKey ?? null,
    delivered_at: new Date().toISOString(),
    payload: { title: input.title, href: input.href ?? "" },
  });

  if (!input.skipEmail && input.email) {
    const { data: userSettings } = await admin
      .from("user_settings")
      .select("email_notifications")
      .eq("user_id", input.userId)
      .maybeSingle();

    if (userSettings?.email_notifications ?? true) {
      await queueEmail({
        to: input.email.to,
        subject: input.email.subject,
        body: input.email.body,
        template: input.type,
        metadata: { userId: input.userId, href: input.href ?? "", notificationId: input.notificationId },
      });

      await admin.from("notification_delivery_log").insert({
        user_id: input.userId,
        channel: "email",
        event_type: input.eventType,
        status: "queued",
        notification_id: input.notificationId,
        priority: input.priority ?? "normal",
        silent: input.silent ?? false,
        group_key: input.groupKey ?? null,
        payload: { to: input.email.to, subject: input.email.subject },
      });
    }
  }

  if (!input.skipPush) {
    await sendPushNotification(input.userId, {
      title: input.title,
      body: input.subtitle,
      href: input.href,
      notificationId: input.notificationId,
      eventType: input.eventType,
      priority: input.priority,
      silent: input.silent,
      groupKey: input.groupKey,
    });
  }
}
