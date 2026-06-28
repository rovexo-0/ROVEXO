import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeAiOsAction } from "@/lib/enterprise-ai-operating-system/actions";
import { getAiOsSnapshot } from "@/lib/enterprise-ai-operating-system/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  mode: z.string().optional(),
  mfaVerified: z.boolean().optional(),
}).passthrough();

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const enterpriseAiOs = await getAiOsSnapshot("scan");
  return NextResponse.json({ enterpriseAiOs, scans: enterpriseAiOs.scans });
}

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  const mode = parsed.success ? parsed.data.mode ?? "quick" : "quick";

  try {
    const result = await executeAiOsAction("run-scan", auth.user.id, { mode, mfaVerified: true });
    const enterpriseAiOs = await getAiOsSnapshot("scan");
    return NextResponse.json({ ok: true, ...result, enterpriseAiOs });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scan failed" }, { status: 400 });
  }
}
