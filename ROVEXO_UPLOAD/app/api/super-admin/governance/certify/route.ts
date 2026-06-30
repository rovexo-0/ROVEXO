import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { executeGovernanceAction } from "@/lib/enterprise-governance-center/actions";
import { getGovernanceSnapshot } from "@/lib/enterprise-governance-center/reader";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  try {
    const result = await executeGovernanceAction("certify", auth.user.id, { mfaVerified: true });
    const governance = await getGovernanceSnapshot();
    return NextResponse.json({ ok: true, ...result, governance });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Certify failed" }, { status: 400 });
  }
}
