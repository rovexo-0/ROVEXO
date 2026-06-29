import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { publishWorkflowConfiguration } from "@/lib/enterprise-workflow-engine/actions";
import { getWorkflowEngineSnapshot } from "@/lib/enterprise-workflow-engine/reader";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    await publishWorkflowConfiguration(auth.user.id);
    const snapshot = await getWorkflowEngineSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Publish failed" }, { status: 400 });
  }
}
