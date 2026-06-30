import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeMarketplaceCompletionAction } from "@/lib/enterprise-marketplace-completion-engine/actions";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ action: z.string().min(1).optional(), format: z.string().optional(), mfaVerified: z.boolean().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  try {
    const result = await executeMarketplaceCompletionAction("export", auth.user.id, parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Export failed" }, { status: 400 });
  }
}
