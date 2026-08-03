import { TrustAdminDashboard } from "@/features/admin/components/TrustAdminDashboard";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getTrustAnalyticsSummary, listPendingVerifications, listTrustAdminAudit } from "@/lib/trust/service";

export default async function SuperAdminTrustPage() {
  const [summary, pending, audit] = await Promise.all([
    getTrustAnalyticsSummary(),
    listPendingVerifications(50),
    listTrustAdminAudit(undefined, 50),
  ]);

  return (
    <>
      <SuperAdminPageHeader title="Trust Score" description="Adjust scores, review verification, and manage trust events." />
      <TrustAdminDashboard summary={summary} pending={pending} audit={audit} />
    </>
  );
}
