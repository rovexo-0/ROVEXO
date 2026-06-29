import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getEnterpriseComplianceSnapshot } from "@/lib/enterprise-compliance-center-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const enterpriseCompliance = await getEnterpriseComplianceSnapshot();
  return NextResponse.json({ enterpriseCompliance });
}
