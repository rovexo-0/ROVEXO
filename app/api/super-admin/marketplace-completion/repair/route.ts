import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeMarketplaceCompletionAction } from "@/lib/enterprise-marketplace-completion-engine/actions";
import { getMarketplaceCompletionSnapshot } from "@/lib/enterprise-marketplace-completion-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ action: z.string().min(1).optional(), mfaVerified: z.boolean().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  try {
    const result = await executeMarketplaceCompletionAction("repair", auth.user.id, parsed.data);
    const marketplaceCompletion = await getMarketplaceCompletionSnapshot();
    return NextResponse.json({ ok: true, ...result, marketplaceCompletion });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Repair failed" }, { status: 400 });
  }
}
