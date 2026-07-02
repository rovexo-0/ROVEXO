import { renderAutomationPage, automationMetadata } from "@/lib/enterprise-automation-hub/page";

export default async function SuperAdminAutomationVersionsPage() {
  return renderAutomationPage({ tab: "versions", title: "Versions", description: "Workflow version history and rollback." });
}

export async function generateMetadata() {
  return automationMetadata("Versions");
}
