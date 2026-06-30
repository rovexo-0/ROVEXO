import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeObservabilityAction } from "@/lib/enterprise-observability-center/actions";
import { getObservabilitySnapshot } from "@/lib/enterprise-observability-center/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ action: z.string().min(1).optional(), mfaVerified: z.boolean().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const action = parsed.data.action ?? "export";
  try {
    const result = await executeObservabilityAction(action, auth.user.id, parsed.data);
    const observability = await getObservabilitySnapshot();
    return NextResponse.json({ ok: true, ...result, observability });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Action failed" }, { status: 400 });
  }
}
