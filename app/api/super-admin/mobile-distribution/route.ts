import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getMobileDistributionCenterEngineSnapshot } from "@/lib/mobile-distribution-center-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const mobileDistribution = await getMobileDistributionCenterEngineSnapshot();
  return NextResponse.json({ mobileDistribution });
}
