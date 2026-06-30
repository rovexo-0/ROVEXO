import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/notifications/badge-counts-server";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const count = await getUnreadNotificationCount(auth.user.id);
  return NextResponse.json({ count });
}
