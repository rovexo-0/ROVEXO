import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeAiOsAction } from "@/lib/enterprise-ai-operating-system/actions";
import { getAiOsSnapshot } from "@/lib/enterprise-ai-operating-system/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  repairId: z.string().min(1),
  mfaVerified: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  try {
    const result = await executeAiOsAction("approve-repair", auth.user.id, { ...parsed.data, mfaVerified: true });
    const enterpriseAiOs = await getAiOsSnapshot("repairs");
    return NextResponse.json({ ok: true, ...result, enterpriseAiOs });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Approval failed" }, { status: 400 });
  }
}
