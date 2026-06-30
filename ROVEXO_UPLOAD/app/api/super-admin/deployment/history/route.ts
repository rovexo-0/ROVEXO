import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { deploymentConfigLifecycle } from "@/lib/enterprise-deployment-center/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;
  const live = await deploymentConfigLifecycle.readLive();
  return NextResponse.json({
    history: live.settings.deploymentHistory,
    auditLog: live.auditLog,
  });
}
