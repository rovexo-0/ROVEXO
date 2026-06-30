import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getGovernanceSnapshot } from "@/lib/enterprise-governance-center/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const governance = await getGovernanceSnapshot();
  return NextResponse.json({ governance });
}
