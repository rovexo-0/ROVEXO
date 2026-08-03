import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "evidence",
    title: "Evidence Center",
    description: "Secure audit evidence repository with integrity verification.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Evidence Center");
}
