import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getNotificationEngine,
  updateNotificationEngine,
  updateNotificationSettings,
} from "@/lib/notifications/store";
import { requireApiAuth } from "@/lib/auth/session";
import { notificationSettingsPatchSchema } from "@/lib/account/schemas";

export async function GET(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { settings, engine } = await getNotificationEngine(auth.user.id, auth.supabase);
  return NextResponse.json({ settings, engine });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = notificationSettingsPatchSchema.parse(await request.json());

    if (body.topicId || body.channelId || body.engine) {
      const result = await updateNotificationEngine(
        auth.user.id,
        {
          topicId: body.topicId,
          channelId: body.channelId,
          enabled: body.enabled,
          engine: body.engine,
        },
        auth.supabase,
      );
      return NextResponse.json(result);
    }

    const settings = await updateNotificationSettings(auth.user.id, body, auth.supabase);
    const { engine } = await getNotificationEngine(auth.user.id, auth.supabase);
    return NextResponse.json({ settings, engine });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid settings." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update settings." }, { status: 500 });
  }
}
