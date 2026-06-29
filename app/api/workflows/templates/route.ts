import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { DEFAULT_WORKFLOW_TEMPLATES } from "@/lib/enterprise-workflow-engine/templates";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ templates: DEFAULT_WORKFLOW_TEMPLATES });
}
