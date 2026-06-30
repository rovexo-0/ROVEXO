import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getAuditComplianceEngineSnapshot } from "@/lib/audit-compliance-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const auditCenter = await getAuditComplianceEngineSnapshot();
  return NextResponse.json({ auditCenter });
}
