import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { HomepageEnterpriseCertificationAdmin } from "@/features/super-admin/homepage-enterprise-certification-engine/HomepageEnterpriseCertificationAdmin";
import { getHomepageCertificationPageData } from "@/lib/homepage-enterprise-certification-engine/reader";
import type { HomepageCertificationTab } from "@/lib/homepage-enterprise-certification-engine/types";

type HomepageCertificationPageProps = { tab: HomepageCertificationTab; title: string; description: string };

export async function renderHomepageCertificationPage({ tab, title, description }: HomepageCertificationPageProps) {
  const { snapshot } = await getHomepageCertificationPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <HomepageEnterpriseCertificationAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function homepageCertificationMetadata(title: string) {
  return { title: `${title} · Homepage Enterprise Certification` };
}
