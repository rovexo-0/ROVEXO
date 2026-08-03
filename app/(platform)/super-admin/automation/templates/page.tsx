import { renderAutomationPage, automationMetadata } from "@/lib/enterprise-automation-hub/page";

export default async function SuperAdminAutomationTemplatesPage() {
  return renderAutomationPage({ tab: "templates", title: "Templates", description: "Reusable workflow templates and automation packages." });
}

export async function generateMetadata() {
  return automationMetadata("Templates");
}
