import { renderAutomationPage, automationMetadata } from "@/lib/enterprise-automation-hub/page";

export default async function SuperAdminAutomationRulesPage() {
  return renderAutomationPage({ tab: "rules", title: "Rule Engine", description: "If/then conditions, actions, and validation rules." });
}

export async function generateMetadata() {
  return automationMetadata("Rules");
}
