import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseAutomationHubAdmin } from "@/features/super-admin/enterprise-automation-hub/EnterpriseAutomationHubAdmin";
import { getAutomationPageData } from "@/lib/enterprise-automation-hub/reader";
import type { AutomationTab } from "@/lib/enterprise-automation-hub/types";

type AutomationPageProps = { tab: AutomationTab; title: string; description: string };

export async function renderAutomationPage({ tab, title, description }: AutomationPageProps) {
  const { snapshot } = await getAutomationPageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseAutomationHubAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function automationMetadata(title: string) {
  return { title: `${title} · Automation Hub` };
}
