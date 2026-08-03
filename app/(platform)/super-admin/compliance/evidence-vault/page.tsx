import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "evidence-vault",
    title: "Evidence Vault",
    description: "Secure repository for audit and compliance evidence.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Evidence Vault");
}
