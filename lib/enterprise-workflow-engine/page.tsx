import { SuperAdminPageHeader } from "@/features/super-admin/components/SuperAdminShell";
import { EnterpriseWorkflowEngineAdmin } from "@/features/super-admin/enterprise-workflow-engine/EnterpriseWorkflowEngineAdmin";
import { getWorkflowEnginePageData } from "@/lib/enterprise-workflow-engine/reader";
import type { WorkflowEngineTab } from "@/lib/enterprise-workflow-engine/types";

type WorkflowEnginePageProps = {
  tab: WorkflowEngineTab;
  title: string;
  description: string;
};

export async function renderWorkflowEnginePage({ tab, title, description }: WorkflowEnginePageProps) {
  const { snapshot } = await getWorkflowEnginePageData(tab);
  return (
    <>
      <SuperAdminPageHeader title={title} description={description} />
      <EnterpriseWorkflowEngineAdmin initialSnapshot={snapshot} defaultTab={tab} />
    </>
  );
}

export function workflowEngineMetadata(title: string) {
  return { title: `${title} · Enterprise Workflow Engine` };
}
