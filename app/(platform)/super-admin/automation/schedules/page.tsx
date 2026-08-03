import { renderAutomationPage, automationMetadata } from "@/lib/enterprise-automation-hub/page";

export default async function SuperAdminAutomationSchedulesPage() {
  return renderAutomationPage({ tab: "schedules", title: "Schedules", description: "Cron and scheduled automation jobs." });
}

export async function generateMetadata() {
  return automationMetadata("Schedules");
}
