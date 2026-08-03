import { PlatformAnalyticsDashboard } from "@/features/admin/components/PlatformAnalyticsDashboard";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getPlatformAnalyticsSnapshot } from "@/lib/platform-analytics/service";

export default async function SuperAdminAnalyticsPage() {
  const data = await getPlatformAnalyticsSnapshot();

  return (
    <>
      <SuperAdminPageHeader title="Analytics" description="Cross-platform performance metrics." />
      <PlatformAnalyticsDashboard data={data} />
    </>
  );
}
