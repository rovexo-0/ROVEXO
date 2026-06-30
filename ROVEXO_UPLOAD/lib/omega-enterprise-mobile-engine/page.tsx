import { OmegaEnterpriseMobileAdmin, type OmegaEnterpriseTab } from "@/features/super-admin/omega-enterprise-mobile/OmegaEnterpriseMobileAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getOmegaEnterpriseMobilePageData } from "@/lib/omega-enterprise-mobile-engine/reader";

type OmegaEnterprisePageProps = {
  tab: OmegaEnterpriseTab;
  title: string;
  description: string;
};

export async function renderOmegaEnterprisePage({ tab, title, description }: OmegaEnterprisePageProps) {
  const { snapshot } = await getOmegaEnterpriseMobilePageData();
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <OmegaEnterpriseMobileAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function omegaEnterpriseMetadata(title: string) {
  return { title: `${title} | OMEGA | ROVEXO`, robots: { index: false, follow: false } };
}
