import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseBiAdmin } from "@/features/super-admin/enterprise-business-intelligence/EnterpriseBiAdmin";
import { getBiPageData } from "@/lib/enterprise-business-intelligence/reader";
import type { BiTab } from "@/lib/enterprise-business-intelligence/types";

type BiPageProps = { tab: BiTab; title: string; description: string };

export async function renderBiPage({ tab, title, description }: BiPageProps) {
  const { snapshot } = await getBiPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseBiAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function biMetadata(title: string) {
  return { title: `${title} · Business Intelligence` };
}
