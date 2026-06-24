import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { auditSuperAdminAction } from "@/lib/super-admin/audit";

export async function broadcastSuperAdminNotification(input: {
  actorId: string;
  title: string;
  subtitle: string;
  audience: "all" | "sellers" | "businesses";
}): Promise<{ sent: number }> {
  const admin = createAdminClient();
  let query = admin.from("profiles").select("id, email, role").eq("account_status", "active");

  if (input.audience === "sellers") {
    query = query.in("role", ["seller", "business"]);
  } else if (input.audience === "businesses") {
    query = query.eq("role", "business");
  }

  const { data: profiles } = await query.limit(500);
  let sent = 0;

  for (const profile of profiles ?? []) {
    await dispatchNotification({
      userId: profile.id,
      type: "system",
      title: input.title,
      subtitle: input.subtitle,
      href: "/notifications",
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
    metadata: { audience: input.audience, sent, title: input.title },
  });

  return { sent };
}

export async function sendSuperAdminPushNotification(input: {
  actorId: string;
  userId: string;
  title: string;
  subtitle: string;
}): Promise<void> {
  const { sendPushNotification } = await import("@/lib/push/service");
  await sendPushNotification(input.userId, {
    title: input.title,
    body: input.subtitle,
    href: "/notifications",
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
