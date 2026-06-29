import { VisualCmsAdmin } from "@/features/super-admin/visual-cms/VisualCmsAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getVisualCmsPageData } from "@/lib/visual-cms-engine/reader";

export default async function SuperAdminThemeManagerPage() {
  const { snapshot } = await getVisualCmsPageData();

  return (
    <>
      <SuperAdminPageHeader
        title="Theme Manager"
        description="Draft, preview, publish, rollback, and compare live theme versions."
      />
      <VisualCmsAdmin initialSnapshot={snapshot} defaultTab="theme" />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Theme Manager | ROVEXO",
    robots: { index: false, follow: false },
  };
}
