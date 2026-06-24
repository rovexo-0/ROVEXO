import { TrustAdminDashboard } from "@/features/admin/components/TrustAdminDashboard";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getTrustAnalyticsSummary, listPendingVerifications, listTrustAdminAudit } from "@/lib/trust/service";

export default async function SuperAdminVerificationPage() {
  const [summary, pending, audit] = await Promise.all([
    getTrustAnalyticsSummary(),
    listPendingVerifications(50),
    listTrustAdminAudit(undefined, 50),
  ]);

  return (
    <>
      <SuperAdminPageHeader title="Verification" description="Review and approve identity verification requests." />
      <TrustAdminDashboard summary={summary} pending={pending} audit={audit} />
    </>
  );
}
