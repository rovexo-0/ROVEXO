import { renderAutomationPage, automationMetadata } from "@/lib/enterprise-automation-hub/page";

export default async function SuperAdminAutomationPage() {
  return renderAutomationPage({ tab: "dashboard", title: "Enterprise Automation Hub", description: "Central workflow automation and rule engine platform." });
}

export async function generateMetadata() {
  return automationMetadata("Dashboard");
}
