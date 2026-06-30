import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";
import type { PushPriority } from "@/lib/push/vapid";

type PreferenceCategory =
  | "orders"
  | "messages"
  | "payments"
  | "support"
  | "marketing"
  | "security"
  | "business"
  | "ai";

export type BroadcastAudience = "all" | "sellers" | "businesses" | "buyers" | "admins";

export type BroadcastKind = "platform" | "category" | "emergency";

export async function broadcastSuperAdminNotification(input: {
  actorId: string;
  title: string;
  subtitle: string;
  audience: BroadcastAudience;
  kind?: BroadcastKind;
  country?: string;
  category?: PreferenceCategory;
}): Promise<{ sent: number; skipped: number }> {
  const admin = createAdminClient();
  let query = admin.from("profiles").select("id, email, role").eq("account_status", "active");

  if (input.audience === "sellers") {
    query = query.in("role", ["seller", "business"]);
  } else if (input.audience === "businesses") {
    query = query.eq("role", "business");
  } else if (input.audience === "buyers") {
    query = query.eq("role", "buyer");
  } else if (input.audience === "admins") {
    query = query.eq("role", "admin");
  }

  const { data: profiles } = await query.limit(1000);
  let sent = 0;
  let skipped = 0;

  const kind = input.kind ?? "platform";
  const priority: PushPriority = kind === "emergency" ? "emergency" : kind === "category" ? "normal" : "high";
  const silent = kind !== "emergency";

  const countryFilter = input.country?.trim().toUpperCase();

  for (const profile of profiles ?? []) {
    if (countryFilter) {
      const { data: address } = await admin
        .from("shipping_addresses")
        .select("country")
        .eq("user_id", profile.id)
        .limit(1)
        .maybeSingle();

      const profileCountry = (address?.country ?? "").toUpperCase();
      if (profileCountry !== countryFilter) {
        skipped += 1;
        continue;
      }
    }

    if (input.category) {
      const { data: preferences } = await admin
        .from("notification_preferences")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (preferences && preferences[input.category] === false) {
        skipped += 1;
        continue;
      }
    }

    await dispatchNotification({
      userId: profile.id,
      type: "system",
      title: input.title,
      subtitle: input.subtitle,
      href: "/notifications",
      priority,
      silent,
      email: profile.email
        ? {
            to: profile.email,
            subject: input.title,
            body: input.subtitle,
          }
        : undefined,
    });
    sent += 1;
  }

  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "notifications.broadcast",
    resourceType: "notification",
    metadata: {
      audience: input.audience,
      kind,
      country: input.country ?? null,
      category: input.category ?? null,
      sent,
      skipped,
      title: input.title,
    },
  });

  return { sent, skipped };
}

export async function sendSuperAdminPushNotification(input: {
  actorId: string;
  userId: string;
  title: string;
  subtitle: string;
  priority?: PushPriority;
}): Promise<void> {
  const { sendPushNotification } = await import("@/lib/push/service");
  await sendPushNotification(input.userId, {
    title: input.title,
    body: input.subtitle,
    href: "/notifications",
    eventType: "admin_announcement",
    priority: input.priority ?? "high",
  });

  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "notifications.push",
    resourceType: "profile",
    resourceId: input.userId,
    metadata: { title: input.title },
  });
}

export async function sendSuperAdminEmailNotification(input: {
  actorId: string;
  userId: string;
  title: string;
  subtitle: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", input.userId)
    .maybeSingle();

  if (!profile?.email) {
    throw new Error("User email not found.");
  }

  await dispatchNotification({
    userId: input.userId,
    type: "system",
    title: input.title,
    subtitle: input.subtitle,
    href: "/notifications",
    email: {
      to: profile.email,
      subject: input.title,
      body: input.subtitle,
    },
  });

  await auditSuperAdminAction({
    actorId: input.actorId,
    action: "notifications.email",
    resourceType: "profile",
    resourceId: input.userId,
    metadata: { title: input.title },
  });
}
