import { renderWorkflowEnginePage, workflowEngineMetadata } from "@/lib/enterprise-workflow-engine/page";

export default async function SuperAdminWorkflowApprovalsPage() {
  return renderWorkflowEnginePage({
    tab: "approvals",
    title: "Approvals",
    description: "Multi-step approval chains and pending decisions.",
  });
}

export async function generateMetadata() {
  return workflowEngineMetadata("Approvals");
}
