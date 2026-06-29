import { renderWorkflowEnginePage, workflowEngineMetadata } from "@/lib/enterprise-workflow-engine/page";

export default async function SuperAdminWorkflowTemplatesPage() {
  return renderWorkflowEnginePage({
    tab: "templates",
    title: "Workflow Templates",
    description: "Pre-built workflow templates for common automation scenarios.",
  });
}

export async function generateMetadata() {
  return workflowEngineMetadata("Templates");
}
