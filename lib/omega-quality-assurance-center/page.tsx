import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { OmegaQualityAssuranceAdmin } from "@/features/super-admin/omega-quality-assurance-center/OmegaQualityAssuranceAdmin";
import { getQaPageData } from "@/lib/omega-quality-assurance-center/reader";
import type { QaTab } from "@/lib/omega-quality-assurance-center/types";

type QaPageProps = { tab: QaTab; title: string; description: string };

export async function renderQaPage({ tab, title, description }: QaPageProps) {
  const { snapshot } = await getQaPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <OmegaQualityAssuranceAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function qaMetadata(title: string) {
  return { title: `${title} · OMEGA QA` };
}
