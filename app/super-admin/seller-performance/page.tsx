import { SellerPerformanceAdminDashboard } from "@/features/admin/components/SellerPerformanceAdminDashboard";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import {
  getSellerPerformanceAnalyticsSummary,
  listSellerPerformanceAudit,
} from "@/lib/seller-performance/service";

export default async function SuperAdminSellerPerformancePage() {
  const [summary, audit] = await Promise.all([
    getSellerPerformanceAnalyticsSummary(),
    listSellerPerformanceAudit(undefined, 50),
  ]);

  return (
    <>
      <SuperAdminPageHeader
        title="Seller Performance"
        description="Reputation Engine — score history, calculations, and audited admin controls."
      />
      <SellerPerformanceAdminDashboard summary={summary} audit={audit} />
    </>
  );
}
