import { createAdminClient } from "@/lib/supabase/admin";

type PushPayload = {
  title: string;
  body: string;
  href?: string;
};

export async function sendPushNotification(userId: string, payload: PushPayload): Promise<void> {
  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth, platform")
    .eq("user_id", userId);

  if (!subscriptions?.length) {
    return;
  }

  for (const subscription of subscriptions) {
    await admin.from("notification_delivery_log").insert({
      user_id: userId,
      channel: "push",
      event_type: "message",
      status: "queued",
      payload: {
        endpoint: subscription.endpoint,
        platform: subscription.platform,
        title: payload.title,
        body: payload.body,
        href: payload.href ?? "",
      },
    });
  }
}
