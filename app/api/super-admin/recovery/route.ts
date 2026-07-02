import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getRecoveryCenterEngineSnapshot } from "@/lib/recovery-center-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const recoveryCenter = await getRecoveryCenterEngineSnapshot();
  return NextResponse.json({ recoveryCenter });
}
