import { SeoAdminDashboard } from "@/features/admin/components/SeoAdminDashboard";
import { SeoHealthCenter } from "@/features/admin/components/SeoHealthCenter";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { buildSeoHealthCenterReport } from "@/lib/seo/engine/health-center";
import { runSeoAudit } from "@/lib/seo/audit";

export default async function SuperAdminSeoPage() {
  const [healthReport, auditReport] = await Promise.all([
    buildSeoHealthCenterReport(),
    Promise.resolve(runSeoAudit()),
  ]);

  return (
    <>
      <SuperAdminPageHeader
        title="Organic Growth Platform"
        description="Enterprise SEO — programmatic pages, discovery, crawl budget, and automated regression."
      />
      <SeoHealthCenter initialReport={healthReport} />
      <div className="mt-ds-8">
        <SeoAdminDashboard initialReport={auditReport} />
      </div>
    </>
  );
}
