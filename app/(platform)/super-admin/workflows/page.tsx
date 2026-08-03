import { renderWorkflowEnginePage, workflowEngineMetadata } from "@/lib/enterprise-workflow-engine/page";

export default async function SuperAdminWorkflowsPage() {
  return renderWorkflowEnginePage({
    tab: "dashboard",
    title: "Enterprise Workflow Engine",
    description: "Configurable workflow automation across the ROVEXO platform.",
  });
}

export async function generateMetadata() {
  return workflowEngineMetadata("Dashboard");
}
