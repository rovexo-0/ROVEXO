import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getOmegaEnterpriseMobileSnapshot } from "@/lib/omega-enterprise-mobile-engine/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const omegaEnterprise = await getOmegaEnterpriseMobileSnapshot();
  return NextResponse.json({ omegaEnterprise });
}
