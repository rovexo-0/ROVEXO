import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { buildSeoAnalyticsSnapshot } from "@/lib/seo/engine/analytics";

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await buildSeoAnalyticsSnapshot();
  return NextResponse.json({ snapshot });
}
