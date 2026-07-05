import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type NativePushPayload = {
  title: string;
  body: string;
  href?: string;
  eventType?: string;
  priority?: "normal" | "high" | "emergency";
  data?: Record<string, string>;
};

export function isFcmConfigured(): boolean {
  return Boolean(process.env.FCM_SERVER_KEY?.trim());
}

export function isApnsConfigured(): boolean {
  return Boolean(process.env.APNS_KEY_ID?.trim() && process.env.APNS_TEAM_ID?.trim());
}

export async function sendFcmPush(token: string, payload: NativePushPayload): Promise<boolean> {
  const serverKey = process.env.FCM_SERVER_KEY?.trim();
  if (!serverKey) return false;

  const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${serverKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      priority: payload.priority === "high" || payload.priority === "emergency" ? "high" : "normal",
      notification: {
        title: payload.title,
        body: payload.body,
        click_action: payload.href ?? "/staff",
      },
      data: {
        href: payload.href ?? "/staff",
        eventType: payload.eventType ?? "staff_alert",
        ...payload.data,
      },
    }),
  });

  return response.ok;
}

export async function sendStaffNativePush(profileId: string, payload: NativePushPayload): Promise<number> {
  const admin = createAdminClient();
  const { data: devices } = await admin
    .from("staff_registered_devices" as never)
    .select("push_token, push_platform, blocked")
    .eq("profile_id", profileId)
    .not("push_token", "is", null);

  let sent = 0;
  for (const device of (devices ?? []) as Array<{
    push_token: string | null;
    push_platform: string | null;
    blocked: boolean;
  }>) {
    if (device.blocked || !device.push_token) continue;

    if (device.push_platform === "android" || device.push_platform === "windows") {
      const ok = await sendFcmPush(device.push_token, payload);
      if (ok) sent += 1;
    } else if (device.push_platform === "ios" && isApnsConfigured()) {
      sent += 1;
    }
  }

  return sent;
}
