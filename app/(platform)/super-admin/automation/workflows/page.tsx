import { renderAutomationPage, automationMetadata } from "@/lib/enterprise-automation-hub/page";

export default async function SuperAdminAutomationWorkflowsPage() {
  return renderAutomationPage({ tab: "workflows", title: "Workflows", description: "Visual workflow builder and execution modes." });
}

export async function generateMetadata() {
  return automationMetadata("Workflows");
}
