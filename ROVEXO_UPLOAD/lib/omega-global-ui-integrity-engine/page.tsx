import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { OmegaGlobalUiIntegrityAdmin } from "@/features/super-admin/omega-global-ui-integrity-engine/OmegaGlobalUiIntegrityAdmin";
import { getGlobalUiIntegrityPageData } from "@/lib/omega-global-ui-integrity-engine/reader";
import type { GlobalUiIntegrityTab } from "@/lib/omega-global-ui-integrity-engine/types";

type GlobalUiIntegrityPageProps = { tab: GlobalUiIntegrityTab; title: string; description: string };

export async function renderGlobalUiIntegrityPage({ tab, title, description }: GlobalUiIntegrityPageProps) {
  const { snapshot } = await getGlobalUiIntegrityPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <OmegaGlobalUiIntegrityAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function globalUiIntegrityMetadata(title: string) {
  return { title: `${title} · OMEGA Global UI Integrity` };
}
