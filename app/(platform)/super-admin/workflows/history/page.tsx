import { renderWorkflowEnginePage, workflowEngineMetadata } from "@/lib/enterprise-workflow-engine/page";

export default async function SuperAdminWorkflowHistoryPage() {
  return renderWorkflowEnginePage({
    tab: "history",
    title: "History",
    description: "Audit trail for workflow configuration and execution.",
  });
}

export async function generateMetadata() {
  return workflowEngineMetadata("History");
}
