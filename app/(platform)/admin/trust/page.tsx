import { TrustAdminDashboard } from "@/features/admin/components/TrustAdminDashboard";
import { getTrustAnalyticsSummary, listPendingVerifications, listTrustAdminAudit } from "@/lib/trust/service";

export default async function AdminTrustPage() {
  const [summary, pending, audit] = await Promise.all([
    getTrustAnalyticsSummary(),
    listPendingVerifications(50),
    listTrustAdminAudit(undefined, 50),
  ]);

  return <TrustAdminDashboard summary={summary} pending={pending} audit={audit} />;
}
