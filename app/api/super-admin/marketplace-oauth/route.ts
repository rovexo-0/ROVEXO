import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getOAuthMonitorSnapshot } from "@/lib/seller/marketplace/oauth/connection-manager";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getOAuthMonitorSnapshot();
  return NextResponse.json({ ok: true, ...snapshot });
}
