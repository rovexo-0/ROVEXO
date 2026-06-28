import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseAiOperatingSystemAdmin } from "@/features/super-admin/enterprise-ai-operating-system/EnterpriseAiOperatingSystemAdmin";
import { getAiOsPageData } from "@/lib/enterprise-ai-operating-system/reader";
import type { AiOsTab } from "@/lib/enterprise-ai-operating-system/types";

type AiOsPageProps = {
  tab: AiOsTab;
  title: string;
  description: string;
};

export async function renderAiOsPage({ tab, title, description }: AiOsPageProps) {
  const { snapshot } = await getAiOsPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseAiOperatingSystemAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function aiOsMetadata(title: string) {
  return { title: `${title} · Enterprise AI OS` };
}
