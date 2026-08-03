import { ProductionOperationsDashboard } from "@/features/admin/components/ProductionOperationsDashboard";
import { SuperAdminMonitoringWidgets } from "@/features/super-admin/components/SuperAdminMonitoringWidgets";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getMonitoringWidgets } from "@/lib/super-admin/insights";
import { getProductionOperationsSnapshot } from "@/lib/ops/production-status";

export default async function SuperAdminMonitoringPage() {
  const data = await getProductionOperationsSnapshot();
  const widgets = await getMonitoringWidgets(data.health);

  return (
    <>
      <SuperAdminPageHeader title="System Health" description="Platform health, cron jobs, errors, and integrations." />
      <div className="space-y-ds-6">
        <SuperAdminMonitoringWidgets widgets={widgets} />
        <ProductionOperationsDashboard data={data} />
      </div>
    </>
  );
}
