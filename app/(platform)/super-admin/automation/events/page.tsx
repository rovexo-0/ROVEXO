import { renderAutomationPage, automationMetadata } from "@/lib/enterprise-automation-hub/page";

export default async function SuperAdminAutomationEventsPage() {
  return renderAutomationPage({ tab: "events", title: "Event Triggers", description: "Marketplace and platform event automation triggers." });
}

export async function generateMetadata() {
  return automationMetadata("Events");
}
