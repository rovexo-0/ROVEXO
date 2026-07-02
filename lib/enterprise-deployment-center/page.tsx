import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseDeploymentCenterAdmin } from "@/features/super-admin/enterprise-deployment-center/EnterpriseDeploymentCenterAdmin";
import { getDeploymentPageData } from "@/lib/enterprise-deployment-center/reader";
import type { DeploymentTab } from "@/lib/enterprise-deployment-center/types";

type DeploymentPageProps = {
  tab: DeploymentTab;
  title: string;
  description: string;
};

export async function renderDeploymentPage({ tab, title, description }: DeploymentPageProps) {
  const { snapshot } = await getDeploymentPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseDeploymentCenterAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function deploymentMetadata(title: string) {
  return { title: `${title} · Deployment Center` };
}
