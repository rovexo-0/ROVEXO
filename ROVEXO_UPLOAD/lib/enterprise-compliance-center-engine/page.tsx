import {
  EnterpriseComplianceCenterAdmin,
  type EnterpriseComplianceTab,
} from "@/features/super-admin/enterprise-compliance-center/EnterpriseComplianceCenterAdmin";
import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { getEnterpriseCompliancePageData } from "@/lib/enterprise-compliance-center-engine/reader";

type EnterpriseCompliancePageProps = {
  tab: EnterpriseComplianceTab;
  title: string;
  description: string;
};

export async function renderEnterpriseCompliancePage({ tab, title, description }: EnterpriseCompliancePageProps) {
  const { snapshot } = await getEnterpriseCompliancePageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseComplianceCenterAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function enterpriseComplianceMetadata(title: string) {
  return { title: `${title} | Audit & Compliance | ROVEXO`, robots: { index: false, follow: false } };
}
