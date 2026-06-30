import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "settings",
    title: "Compliance Settings",
    description: "Enterprise compliance center configuration.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Compliance Settings");
}
