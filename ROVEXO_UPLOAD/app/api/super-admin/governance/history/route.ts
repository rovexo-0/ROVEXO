import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { governanceConfigLifecycle } from "@/lib/enterprise-governance-center/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const history = await governanceConfigLifecycle.getHistory();
  return NextResponse.json({ history });
}
