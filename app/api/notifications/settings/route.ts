import { NextResponse } from "next/server";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/lib/notifications/store";
import { requireApiAuth } from "@/lib/auth/session";
import type { NotificationSettings } from "@/lib/notifications/types";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const settings = await getNotificationSettings(auth.user.id);
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = (await request.json()) as Partial<NotificationSettings>;
    const settings = await updateNotificationSettings(auth.user.id, body);
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: "Unable to update settings." }, { status: 500 });
  }
}
