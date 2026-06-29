import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getWorkflowEngineSnapshot } from "@/lib/enterprise-workflow-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const workflowEngine = await getWorkflowEngineSnapshot();
  return NextResponse.json({ workflowEngine });
}
