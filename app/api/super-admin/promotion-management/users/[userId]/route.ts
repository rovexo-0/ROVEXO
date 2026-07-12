import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getUserPromotionProfile } from "@/lib/promotions/admin-engine";
import { listPromotionAuditLog } from "@/lib/promotions/audit-log";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { userId } = await context.params;
  const [profile, audit] = await Promise.all([
    getUserPromotionProfile(userId),
    listPromotionAuditLog({ userId, limit: 50 }),
  ]);

  if (!profile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ profile, audit });
}
