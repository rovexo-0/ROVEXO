import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "change-timeline",
    title: "Change Timeline",
    description: "Configuration, permission, and deployment change history.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Change Timeline");
}
