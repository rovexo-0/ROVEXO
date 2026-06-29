import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { aiOsConfigLifecycle } from "@/lib/enterprise-ai-operating-system/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const history = await aiOsConfigLifecycle.getHistory();
  return NextResponse.json({ history });
}
