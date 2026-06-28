import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeGovernanceAction } from "@/lib/enterprise-governance-center/actions";
import { getGovernanceSnapshot } from "@/lib/enterprise-governance-center/reader";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ format: z.string().optional() }).passthrough();

export async function POST(request: Request) {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  try {
    const result = await executeGovernanceAction("export", auth.user.id, { ...parsed.data, mfaVerified: true });
    const governance = await getGovernanceSnapshot();
    return NextResponse.json({ ok: true, ...result, governance });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Export failed" }, { status: 400 });
  }
}
