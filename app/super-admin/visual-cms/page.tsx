import { VisualCmsAdmin } from "@/features/super-admin/visual-cms/VisualCmsAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getVisualCmsPageData } from "@/lib/visual-cms-engine/reader";

export default async function SuperAdminVisualCmsPage() {
  const { snapshot } = await getVisualCmsPageData();

  return (
    <>
      <SuperAdminPageHeader
        title="Visual CMS"
        description="Enterprise visual design platform — builders, canvas, assets, themes, preview, and live publishing."
      />
      <VisualCmsAdmin initialSnapshot={snapshot} defaultTab="overview" />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Visual CMS | ROVEXO",
    robots: { index: false, follow: false },
  };
}
