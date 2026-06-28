import { renderAutomationPage, automationMetadata } from "@/lib/enterprise-automation-hub/page";

export default async function SuperAdminAutomationApprovalsPage() {
  return renderAutomationPage({ tab: "approvals", title: "Approvals", description: "Draft, pending, approved, and published workflow lifecycle." });
}

export async function generateMetadata() {
  return automationMetadata("Approvals");
}
