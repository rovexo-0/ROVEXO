import { renderAutomationPage, automationMetadata } from "@/lib/enterprise-automation-hub/page";

export default async function SuperAdminAutomationMonitoringPage() {
  return renderAutomationPage({ tab: "monitoring", title: "Monitoring", description: "Real-time status, queue monitoring, and execution metrics." });
}

export async function generateMetadata() {
  return automationMetadata("Monitoring");
}
