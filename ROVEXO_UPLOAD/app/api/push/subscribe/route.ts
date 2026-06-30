import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  platform: z.enum(["web", "android", "ios"]).default("web"),
});

export async function POST(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = subscriptionSchema.parse(await request.json());
    const admin = createAdminClient();
    const userAgent = request.headers.get("user-agent");

    await admin.from("push_subscriptions").upsert(
      {
        user_id: auth.user.id,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        platform: body.platform,
        user_agent: userAgent,
      },
      { onConflict: "user_id,endpoint" },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to save subscription." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) return auth;

  const { endpoint } = (await request.json()) as { endpoint?: string };
  if (!endpoint) {
    return NextResponse.json({ error: "Endpoint required." }, { status: 400 });
  }

  const admin = createAdminClient();
  await admin.from("push_subscriptions").delete().eq("user_id", auth.user.id).eq("endpoint", endpoint);

  return NextResponse.json({ success: true });
}
