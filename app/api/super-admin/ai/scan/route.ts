import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getAiOsSnapshot } from "@/lib/enterprise-ai-operating-system/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const enterpriseAiOs = await getAiOsSnapshot("scan");
  return NextResponse.json({ enterpriseAiOs, scans: enterpriseAiOs.scans });
}
