import { TrustAdminDashboard } from "@/features/admin/components/TrustAdminDashboard";
import { getTrustAnalyticsSummary, listPendingVerifications } from "@/lib/trust/service";

export default async function AdminTrustPage() {
  const [summary, pending] = await Promise.all([
    getTrustAnalyticsSummary(),
    listPendingVerifications(50),
  ]);

  return <TrustAdminDashboard summary={summary} pending={pending} />;
}
