import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeGovernanceAction } from "@/lib/enterprise-governance-center/actions";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ reportType: z.string().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  try {
    const result = await executeGovernanceAction("report", auth.user.id, { ...parsed.data, mfaVerified: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Report failed" }, { status: 400 });
  }
}
