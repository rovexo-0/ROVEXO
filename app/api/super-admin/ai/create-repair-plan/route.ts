import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeAiOsAction } from "@/lib/enterprise-ai-operating-system/actions";
import { getAiOsSnapshot } from "@/lib/enterprise-ai-operating-system/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  issueType: z.string().optional(),
  mfaVerified: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  const issueType = parsed.success ? parsed.data.issueType ?? "configuration-drift" : "configuration-drift";

  try {
    const result = await executeAiOsAction("create-repair-plan", auth.user.id, { issueType, mfaVerified: true });
    const enterpriseAiOs = await getAiOsSnapshot("repairs");
    return NextResponse.json({ ok: true, ...result, enterpriseAiOs });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Repair plan failed" }, { status: 400 });
  }
}
