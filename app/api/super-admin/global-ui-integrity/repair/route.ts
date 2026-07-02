import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeGlobalUiIntegrityAction } from "@/lib/omega-global-ui-integrity-engine/actions";
import { getGlobalUiIntegritySnapshot } from "@/lib/omega-global-ui-integrity-engine/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ action: z.string().min(1).optional(), mfaVerified: z.boolean().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  try {
    const result = await executeGlobalUiIntegrityAction("repair", auth.user.id, { ...parsed.data, mfaVerified: true });
    const globalUiIntegrity = await getGlobalUiIntegritySnapshot("auto-repair");
    return NextResponse.json({ ok: true, ...result, globalUiIntegrity });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Repair failed" }, { status: 400 });
  }
}
