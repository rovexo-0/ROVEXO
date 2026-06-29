import { renderWorkflowEnginePage, workflowEngineMetadata } from "@/lib/enterprise-workflow-engine/page";

export default async function SuperAdminWorkflowSettingsPage() {
  return renderWorkflowEnginePage({
    tab: "settings",
    title: "Workflow Settings",
    description: "Engine settings, triggers, and feature flags.",
  });
}

export async function generateMetadata() {
  return workflowEngineMetadata("Settings");
}
