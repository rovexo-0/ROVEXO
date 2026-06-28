import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseObservabilityAdmin } from "@/features/super-admin/enterprise-observability-center/EnterpriseObservabilityAdmin";
import { getObservabilityPageData } from "@/lib/enterprise-observability-center/reader";
import type { ObservabilityTab } from "@/lib/enterprise-observability-center/types";

type ObservabilityPageProps = { tab: ObservabilityTab; title: string; description: string };

export async function renderObservabilityPage({ tab, title, description }: ObservabilityPageProps) {
  const { snapshot } = await getObservabilityPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseObservabilityAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function observabilityMetadata(title: string) {
  return { title: `${title} · Enterprise Observability Center` };
}
