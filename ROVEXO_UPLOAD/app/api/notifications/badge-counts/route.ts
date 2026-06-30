import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/auth/session";
import { getNotificationBadgeCounts } from "@/lib/notifications/badge-counts-server";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth instanceof NextResponse) {
    return auth;
  }

  const counts = await getNotificationBadgeCounts(auth.user.id);
  return NextResponse.json({ counts });
}
