import { renderWorkflowEnginePage, workflowEngineMetadata } from "@/lib/enterprise-workflow-engine/page";

export default async function SuperAdminWorkflowsListPage() {
  return renderWorkflowEnginePage({
    tab: "workflows",
    title: "Workflows",
    description: "Manage published and draft enterprise workflows.",
  });
}

export async function generateMetadata() {
  return workflowEngineMetadata("Workflows");
}
