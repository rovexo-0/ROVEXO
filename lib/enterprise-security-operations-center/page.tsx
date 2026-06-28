import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseSocAdmin } from "@/features/super-admin/enterprise-security-operations-center/EnterpriseSocAdmin";
import { getSocPageData } from "@/lib/enterprise-security-operations-center/reader";
import type { SocTab } from "@/lib/enterprise-security-operations-center/types";

type SocPageProps = {
  tab: SocTab;
  title: string;
  description: string;
};

export async function renderSocPage({ tab, title, description }: SocPageProps) {
  const { snapshot } = await getSocPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseSocAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function socMetadata(title: string) {
  return { title: `${title} · Security Operations Center` };
}
