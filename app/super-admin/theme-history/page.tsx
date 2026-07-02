import { VisualCmsAdmin } from "@/features/super-admin/visual-cms/VisualCmsAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getVisualCmsPageData } from "@/lib/visual-cms-engine/reader";

export default async function SuperAdminThemeHistoryPage() {
  const { snapshot } = await getVisualCmsPageData();

  return (
    <>
      <SuperAdminPageHeader
        title="Theme History"
        description="Compare versions, rollback themes, and review publish audit references."
      />
      <VisualCmsAdmin initialSnapshot={snapshot} defaultTab="history" />
    </>
  );
}

export async function generateMetadata() {
  return {
    title: "Theme History | ROVEXO",
    robots: { index: false, follow: false },
  };
}
