import { PlatformAnalyticsDashboard } from "@/features/admin/components/PlatformAnalyticsDashboard";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getPlatformAnalyticsSnapshot } from "@/lib/platform-analytics/service";

export default async function SuperAdminRevenuePage() {
  const data = await getPlatformAnalyticsSnapshot();

  return (
    <>
      <SuperAdminPageHeader title="Revenue" description="Platform revenue, subscriptions, and monetization metrics." />
      <PlatformAnalyticsDashboard data={data} />
    </>
  );
}
