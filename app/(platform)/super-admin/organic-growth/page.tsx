import { OrganicGrowthDashboardView } from "@/features/super-admin/organic-growth/OrganicGrowthDashboard";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { buildOrganicGrowthDashboard } from "@/lib/organic-growth/dashboard";

/** Heavy dashboard — never SSG (Build Absolute Law: no 60s static timeout). */
export const dynamic = "force-dynamic";

export default async function SuperAdminOrganicGrowthPage() {
  const dashboard = await buildOrganicGrowthDashboard();

  return (
    <>
      <SuperAdminPageHeader
        title="Organic Growth Engine"
        description="Enterprise organic acquisition — discovery, trends, engagement, and automated growth opportunities."
      />
      <OrganicGrowthDashboardView initialDashboard={dashboard} />
    </>
  );
}
