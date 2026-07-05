import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getDatabaseHealthSnapshot } from "@/lib/super-admin/database-health/snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const snapshot = await getDatabaseHealthSnapshot();
  return NextResponse.json({ ok: true, snapshot });
}
