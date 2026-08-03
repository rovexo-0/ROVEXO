import { renderWorkflowEnginePage, workflowEngineMetadata } from "@/lib/enterprise-workflow-engine/page";

export default async function SuperAdminWorkflowBuilderPage() {
  return renderWorkflowEnginePage({
    tab: "builder",
    title: "Workflow Builder",
    description: "Visual workflow builder with enterprise node types.",
  });
}

export async function generateMetadata() {
  return workflowEngineMetadata("Builder");
}
