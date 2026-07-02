import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getExecutiveCommandSnapshot } from "@/lib/executive-command-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const executiveCommand = await getExecutiveCommandSnapshot();
  return NextResponse.json({ executiveCommand });
}
