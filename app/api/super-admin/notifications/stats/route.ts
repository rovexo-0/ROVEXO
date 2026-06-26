import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getNotificationDeliveryStats } from "@/lib/super-admin/notification-stats";

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const periodDays = Number(searchParams.get("days") ?? 30);
  const stats = await getNotificationDeliveryStats(
    Number.isFinite(periodDays) && periodDays > 0 ? periodDays : 30,
  );

  return NextResponse.json({ stats });
}
