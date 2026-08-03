import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "history",
    title: "Compliance History",
    description: "Chronological audit, certification, and export history.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Compliance History");
}
