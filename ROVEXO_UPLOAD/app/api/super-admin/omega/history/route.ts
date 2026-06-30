import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { omegaConfigLifecycle } from "@/lib/omega-command-center/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const history = await omegaConfigLifecycle.getHistory();
  return NextResponse.json({ history });
}
