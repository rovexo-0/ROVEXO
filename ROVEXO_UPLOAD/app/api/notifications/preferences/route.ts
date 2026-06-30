import { NextResponse } from "next/server";
import { notificationPreferencesPatchSchema } from "@/lib/account/schemas";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/notifications/store";
import { requireApiAuth } from "@/lib/auth/session";

const DEFAULT_PREFERENCES = {
  orders: true,
  messages: true,
  payments: true,
  support: true,
  marketing: false,
  security: true,
  business: true,
  ai: true,
};

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const preferences = await getNotificationPreferences(auth.user.id);
  return NextResponse.json({ preferences: preferences ?? DEFAULT_PREFERENCES });
}

export async function PATCH(request: Request) {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const parsed = notificationPreferencesPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid preferences." },
        { status: 400 },
      );
    }

    const preferences = await updateNotificationPreferences(auth.user.id, parsed.data);
    return NextResponse.json({ preferences: preferences ?? DEFAULT_PREFERENCES });
  } catch {
    return NextResponse.json({ error: "Unable to update preferences." }, { status: 500 });
  }
}
