import { renderAutomationPage, automationMetadata } from "@/lib/enterprise-automation-hub/page";

export default async function SuperAdminAutomationHistoryPage() {
  return renderAutomationPage({ tab: "history", title: "Execution History", description: "Execution timeline, logs, and rollback availability." });
}

export async function generateMetadata() {
  return automationMetadata("History");
}
