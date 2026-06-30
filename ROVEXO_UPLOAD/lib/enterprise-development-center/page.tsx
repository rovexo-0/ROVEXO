import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseDevelopmentAdmin } from "@/features/super-admin/enterprise-development-center/EnterpriseDevelopmentAdmin";
import { getDevelopmentPageData } from "@/lib/enterprise-development-center/reader";
import type { DevelopmentTab } from "@/lib/enterprise-development-center/types";

type DevelopmentPageProps = { tab: DevelopmentTab; title: string; description: string };

export async function renderDevelopmentPage({ tab, title, description }: DevelopmentPageProps) {
  const { snapshot } = await getDevelopmentPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseDevelopmentAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function developmentMetadata(title: string) {
  return { title: `${title} · Development Center` };
}
