import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "policies",
    title: "Compliance Policies",
    description: "Enterprise compliance and security policies.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Compliance Policies");
}
