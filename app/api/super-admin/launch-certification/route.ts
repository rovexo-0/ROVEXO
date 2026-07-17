import { NextResponse } from "next/server";
import { requireApiSuperAdmin } from "@/lib/auth/session";
import { runCertificationDashboardScan } from "@/lib/launch-certification/dashboard-scanner";
import { resolveLaunchCertificationSummary } from "@/lib/launch-certification/gate";
import { resolveCertificationModeConfig } from "@/lib/launch-certification/certification-mode";
import { resolveLaunchPrivateModeState } from "@/lib/launch-certification/private-mode";
import { listLaunchDemoAccounts } from "@/lib/launch-certification/demo-accounts";
import { listFullDemoAccounts, FULL_DEMO_VERSION, FULL_DEMO_BUYER_QUOTAS, FULL_DEMO_SELLER_QUOTAS } from "@/lib/full-demo/canonical";
import { resolveFullDemoSecuritySnapshot } from "@/lib/full-demo/security";
import { runFullDemoCertificationScan } from "@/lib/full-demo/deploy-gate";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSuperAdmin();
  if (auth instanceof NextResponse) return auth;

  const dashboard = runCertificationDashboardScan();
  const summary = resolveLaunchCertificationSummary();
  const certification = runFullDemoCertificationScan();

  return NextResponse.json({
    dashboard,
    summary,
    mode: resolveCertificationModeConfig(),
    privateMode: resolveLaunchPrivateModeState(),
    demoAccounts: listLaunchDemoAccounts(),
    fullDemo: {
      version: FULL_DEMO_VERSION,
      accounts: listFullDemoAccounts().map((account) => ({
        key: account.key,
        email: account.email,
        label: account.label,
        role: account.certificationRole,
        virtualFundsGbp: account.virtualFundsGbp,
        permissions: account.permissions,
      })),
      quotas: {
        buyer: FULL_DEMO_BUYER_QUOTAS,
        seller: FULL_DEMO_SELLER_QUOTAS,
      },
      security: resolveFullDemoSecuritySnapshot(),
      certification,
      deploymentBlocked: certification.deploymentBlocked,
    },
  });
}
