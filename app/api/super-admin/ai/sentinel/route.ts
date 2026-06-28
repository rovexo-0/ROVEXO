import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getAiOsSnapshot } from "@/lib/enterprise-ai-operating-system/reader";
import { buildRiskTimeline } from "@/lib/enterprise-ai-operating-system/sentinel";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const enterpriseAiOs = await getAiOsSnapshot("sentinel");
  return NextResponse.json({
    enterpriseAiOs,
    alerts: enterpriseAiOs.alerts,
    scores: enterpriseAiOs.sentinelScores,
    timeline: buildRiskTimeline(enterpriseAiOs.alerts),
  });
}
