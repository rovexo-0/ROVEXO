import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeAiOsAction } from "@/lib/enterprise-ai-operating-system/actions";
import { getAiOsSnapshot } from "@/lib/enterprise-ai-operating-system/reader";

export const dynamic = "force-dynamic";

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
