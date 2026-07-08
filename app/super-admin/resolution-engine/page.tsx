import { ResolutionMonitorAdmin } from "@/features/commerce/components/ResolutionMonitorAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getResolutionMonitorStats } from "@/lib/resolution-engine";

export default async function SuperAdminResolutionEnginePage() {
  const stats = await getResolutionMonitorStats();

  return (
    <>
      <SuperAdminPageHeader
        title="Resolution Engine"
        description="Automated resolution monitor — logs, events, and carrier performance. No manual operations."
      />
      <ResolutionMonitorAdmin stats={stats} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Resolution Engine | ROVEXO",
    robots: { index: false, follow: false },
  };
}
