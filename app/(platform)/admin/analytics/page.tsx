import { PlatformAnalyticsDashboard } from "@/features/admin/components/PlatformAnalyticsDashboard";
import { getPlatformAnalyticsSnapshot } from "@/lib/platform-analytics/service";

export default async function AdminAnalyticsPage() {
  const data = await getPlatformAnalyticsSnapshot();
  return <PlatformAnalyticsDashboard data={data} />;
}
