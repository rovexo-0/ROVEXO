import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { listPromotionAuditLog } from "@/lib/promotions/audit-log";

export async function GET(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 100);

  const audit = await listPromotionAuditLog({ userId, limit });
  return NextResponse.json({ audit });
}
