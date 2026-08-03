import { AnalyticsEngineAdmin } from "@/features/super-admin/analytics-engine/AnalyticsEngineAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getAnalyticsEngineSnapshot } from "@/lib/analytics-engine/reader";

export default async function SuperAdminAnalyticsEnginePage() {
  const snapshot = await getAnalyticsEngineSnapshot();

  return (
    <>
      <SuperAdminPageHeader
        title="Analytics Engine"
        description="Enterprise business intelligence — dashboards, financial analytics, live metrics, and integrations."
      />
      <AnalyticsEngineAdmin initialSnapshot={snapshot} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Analytics Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
