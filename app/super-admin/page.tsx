import { SuperAdminDashboard } from "@/features/super-admin/components/SuperAdminDashboard";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getSuperAdminDashboardData } from "@/lib/super-admin/dashboard";

export default async function SuperAdminHomePage() {
  const data = await getSuperAdminDashboardData();

  return (
    <>
      <SuperAdminPageHeader
        title="Super Admin Dashboard"
        description="Complete platform overview for the single ROVEXO Super Admin account."
      />
      <SuperAdminDashboard data={data} />
    </>
  );
}
