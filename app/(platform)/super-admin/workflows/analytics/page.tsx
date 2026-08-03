import { renderWorkflowEnginePage, workflowEngineMetadata } from "@/lib/enterprise-workflow-engine/page";

export default async function SuperAdminWorkflowAnalyticsPage() {
  return renderWorkflowEnginePage({
    tab: "analytics",
    title: "Workflow Analytics",
    description: "Execution metrics, success rates, and trigger statistics.",
  });
}

export async function generateMetadata() {
  return workflowEngineMetadata("Analytics");
}
