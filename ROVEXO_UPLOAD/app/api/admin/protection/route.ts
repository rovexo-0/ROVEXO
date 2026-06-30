import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/auth/session";
import { listOpenProtectionCases } from "@/lib/protection/service";

export async function GET() {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const cases = await listOpenProtectionCases(100);
  return NextResponse.json({ cases });
}
