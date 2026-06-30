import { renderWorkflowEnginePage, workflowEngineMetadata } from "@/lib/enterprise-workflow-engine/page";

export default async function SuperAdminWorkflowVersionsPage() {
  return renderWorkflowEnginePage({
    tab: "versions",
    title: "Versions",
    description: "Workflow version history and rollback targets.",
  });
}

export async function generateMetadata() {
  return workflowEngineMetadata("Versions");
}
