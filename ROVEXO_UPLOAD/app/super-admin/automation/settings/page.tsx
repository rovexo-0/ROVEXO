import { renderAutomationPage, automationMetadata } from "@/lib/enterprise-automation-hub/page";

export default async function SuperAdminAutomationSettingsPage() {
  return renderAutomationPage({ tab: "settings", title: "Settings", description: "Automation hub configuration and import/export." });
}

export async function generateMetadata() {
  return automationMetadata("Settings");
}
