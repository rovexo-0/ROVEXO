import { renderAutomationPage, automationMetadata } from "@/lib/enterprise-automation-hub/page";

export default async function SuperAdminAutomationDashboardPage() {
  return renderAutomationPage({ tab: "dashboard", title: "Automation Dashboard", description: "Active workflows, jobs, and automation health." });
}

export async function generateMetadata() {
  return automationMetadata("Dashboard");
}
