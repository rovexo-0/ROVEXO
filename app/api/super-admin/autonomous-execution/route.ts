import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getExecutionEngineSnapshot } from "@/lib/enterprise-autonomous-execution-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const autonomousExecution = await getExecutionEngineSnapshot();
  return NextResponse.json({ autonomousExecution });
}
