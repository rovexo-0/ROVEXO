import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeOmegaAction } from "@/lib/omega-command-center/actions";
import { getOmegaSnapshot } from "@/lib/omega-command-center/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ recommendationId: z.string().optional(), mfaVerified: z.boolean().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  try {
    const result = await executeOmegaAction("repair", auth.user.id, { ...parsed.data, mfaVerified: true });
    const omega = await getOmegaSnapshot();
    return NextResponse.json({ ok: true, ...result, omega });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Repair failed" }, { status: 400 });
  }
}
