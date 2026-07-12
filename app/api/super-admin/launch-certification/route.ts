import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { runCertificationDashboardScan } from "@/lib/launch-certification/dashboard-scanner";
import { resolveLaunchCertificationSummary } from "@/lib/launch-certification/gate";
import { resolveCertificationModeConfig } from "@/lib/launch-certification/certification-mode";
import { resolveLaunchPrivateModeState } from "@/lib/launch-certification/private-mode";
import { listLaunchDemoAccounts } from "@/lib/launch-certification/demo-accounts";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const dashboard = runCertificationDashboardScan();
  const summary = resolveLaunchCertificationSummary();

  return NextResponse.json({
    dashboard,
    summary,
    mode: resolveCertificationModeConfig(),
    privateMode: resolveLaunchPrivateModeState(),
    demoAccounts: listLaunchDemoAccounts(),
  });
}
