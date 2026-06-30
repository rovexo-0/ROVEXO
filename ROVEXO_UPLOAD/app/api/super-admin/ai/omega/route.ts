import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeAiOsAction } from "@/lib/enterprise-ai-operating-system/actions";
import { getAiOsSnapshot } from "@/lib/enterprise-ai-operating-system/reader";
import { runOmegaAnalysis } from "@/lib/enterprise-ai-operating-system/omega";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const enterpriseAiOs = await getAiOsSnapshot("omega");
  const analysis = runOmegaAnalysis(enterpriseAiOs.scans, enterpriseAiOs.alerts);
  return NextResponse.json({ enterpriseAiOs, analysis });
}

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const result = await executeAiOsAction("run-analysis", auth.user.id, { mfaVerified: true });
    const enterpriseAiOs = await getAiOsSnapshot("omega");
    return NextResponse.json({ ok: true, ...result, enterpriseAiOs });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Analysis failed" }, { status: 400 });
  }
}
