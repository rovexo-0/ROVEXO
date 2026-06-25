import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/lib/notifications/store";
import { requireApiAuth } from "@/lib/auth/session";
import { notificationSettingsPatchSchema } from "@/lib/account/schemas";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const settings = await getNotificationSettings(auth.user.id);
  return NextResponse.json({
    settings: settings ?? {
      pushEnabled: true,
      messages: true,
      orders: true,
      offers: true,
      reviews: true,
      promotions: true,
      marketing: false,
      system: true,
      emailMessages: true,
      emailOrders: true,
      emailPromotions: false,
      emailMarketing: false,
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      sound: true,
      vibration: true,
    },
  });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = notificationSettingsPatchSchema.parse(await request.json());
    const settings = await updateNotificationSettings(auth.user.id, body);
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid settings." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update settings." }, { status: 500 });
  }
}
