import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeQaAction } from "@/lib/omega-quality-assurance-center/actions";
import { getQaSnapshot } from "@/lib/omega-quality-assurance-center/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ action: z.string().min(1).optional(), mfaVerified: z.boolean().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const action = parsed.data.action ?? "export";
  try {
    const result = await executeQaAction(action, auth.user.id, parsed.data);
    const qualityAssurance = await getQaSnapshot();
    return NextResponse.json({ ok: true, ...result, qualityAssurance });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}
