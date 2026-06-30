import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { exportWorkflowConfiguration } from "@/lib/enterprise-workflow-engine/actions";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const document = await exportWorkflowConfiguration();
  return NextResponse.json({ ok: true, document });
}
