import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { getDeploymentSnapshot } from "@/lib/enterprise-deployment-center/reader";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const deploymentCenter = await getDeploymentSnapshot("releases");
  return NextResponse.json({ deploymentCenter, releases: deploymentCenter.releases });
}
