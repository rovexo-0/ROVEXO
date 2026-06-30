import { SeoAdminDashboard } from "@/features/admin/components/SeoAdminDashboard";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { runSeoAudit } from "@/lib/seo/audit";

export default async function SuperAdminSeoPage() {
  const report = runSeoAudit();

  return (
    <>
      <SuperAdminPageHeader title="SEO" description="Sitemap, metadata, and SEO audit controls." />
      <SeoAdminDashboard initialReport={report} />
    </>
  );
}
