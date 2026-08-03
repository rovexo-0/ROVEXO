import { DeveloperToolsPanel } from "@/features/super-admin/mission-control/DeveloperToolsPanel";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getSuperAdminDashboardData } from "@/lib/super-admin/dashboard";

export default async function SuperAdminDeveloperPage() {
  const data = await getSuperAdminDashboardData();

  return (
    <>
      <SuperAdminPageHeader
        title="Developer Tools"
        description="Clear cache, rebuild assets, validate production readiness, and inspect environment."
      />
      <DeveloperToolsPanel environment={data.operations.environment} />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Developer Tools | Mission Control | ROVEXO",
    robots: { index: false, follow: false },
  };
}
