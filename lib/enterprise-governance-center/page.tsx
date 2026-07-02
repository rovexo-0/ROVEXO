import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseGovernanceAdmin } from "@/features/super-admin/enterprise-governance-center/EnterpriseGovernanceAdmin";
import { getGovernancePageData } from "@/lib/enterprise-governance-center/reader";
import type { GovernanceTab } from "@/lib/enterprise-governance-center/types";

type GovernancePageProps = { tab: GovernanceTab; title: string; description: string };

export async function renderGovernancePage({ tab, title, description }: GovernancePageProps) {
  const { snapshot } = await getGovernancePageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseGovernanceAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function governanceMetadata(title: string) {
  return { title: `${title} · Enterprise Governance` };
}
