import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getAiOperationsSnapshot } from "@/lib/super-admin/operations/snapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const snapshot = await getAiOperationsSnapshot();
  return NextResponse.json({ snapshot });
}
