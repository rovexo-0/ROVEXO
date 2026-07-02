import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { HomepageBuilderEngineAdmin } from "@/features/super-admin/homepage-builder-engine/HomepageBuilderEngineAdmin";
import { getHomepageBuilderPageData } from "@/lib/homepage-builder-engine/reader";
import type { HomepageBuilderTab } from "@/lib/homepage-builder-engine/types";

type HomepageBuilderPageProps = {
  tab: HomepageBuilderTab;
  title: string;
  description: string;
};

export async function renderHomepageBuilderPage({ tab, title, description }: HomepageBuilderPageProps) {
  const { snapshot } = await getHomepageBuilderPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <HomepageBuilderEngineAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function homepageBuilderMetadata(title: string) {
  return { title: `${title} · Homepage Builder · ROVEXO` };
}
