import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiStaff } from "@/lib/auth/session";
import { registerStaffDevice } from "@/lib/staff-enterprise/directory";
import { toStaffActionContext } from "@/lib/staff-profile";
import { createAdminClient } from "@/lib/supabase/admin";

const postSchema = z.object({
  platform: z.enum(["android", "ios", "windows", "web", "browser"]),
  pushToken: z.string().min(1),
  deviceName: z.string().min(1),
  subscription: z
    .object({
      endpoint: z.string().url(),
      p256dh: z.string(),
      auth: z.string(),
    })
    .optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiStaff(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = postSchema.parse(await request.json());
    const context = toStaffActionContext(auth.user.id, request);
    const admin = createAdminClient();

    const deviceId = await registerStaffDevice({
      staffId: auth.staffId,
      profileId: auth.user.id,
      platform: body.platform,
      deviceName: body.deviceName,
      userAgent: request.headers.get("user-agent"),
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      trusted: false,
      context,
    });

    await admin
      .from("staff_registered_devices" as never)
      .update({ push_token: body.pushToken, push_platform: body.platform } as never)
      .eq("id", deviceId);

    if (body.subscription) {
      await admin.from("push_subscriptions").upsert(
        {
          user_id: auth.user.id,
          endpoint: body.subscription.endpoint,
          p256dh: body.subscription.p256dh,
          auth: body.subscription.auth,
          platform: body.platform === "browser" ? "web" : body.platform,
        },
        { onConflict: "user_id,endpoint" },
      );
    }

    return NextResponse.json({ deviceId, registered: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Push registration failed." },
      { status: 400 },
    );
  }
}
