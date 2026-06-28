import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getLaunchReadinessSnapshot } from "@/lib/enterprise-launch-readiness-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const launchReadiness = await getLaunchReadinessSnapshot("dashboard");
  return NextResponse.json({ launchReadiness });
}
