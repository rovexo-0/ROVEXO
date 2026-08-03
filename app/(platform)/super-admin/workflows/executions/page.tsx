import { renderWorkflowEnginePage, workflowEngineMetadata } from "@/lib/enterprise-workflow-engine/page";

export default async function SuperAdminWorkflowExecutionsPage() {
  return renderWorkflowEnginePage({
    tab: "executions",
    title: "Executions",
    description: "Monitor workflow execution history and status.",
  });
}

export async function generateMetadata() {
  return workflowEngineMetadata("Executions");
}
