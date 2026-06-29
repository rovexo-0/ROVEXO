import { VisualCmsAdmin } from "@/features/super-admin/visual-cms/VisualCmsAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getVisualCmsPageData } from "@/lib/visual-cms-engine/reader";

export default async function SuperAdminLivePreviewPage() {
  const { snapshot } = await getVisualCmsPageData();

  return (
    <>
      <SuperAdminPageHeader
        title="Live Preview"
        description="Real-time responsive preview across desktop, laptop, tablet, and mobile viewports."
      />
      <VisualCmsAdmin initialSnapshot={snapshot} defaultTab="preview" />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Live Preview | ROVEXO",
    robots: { index: false, follow: false },
  };
}
