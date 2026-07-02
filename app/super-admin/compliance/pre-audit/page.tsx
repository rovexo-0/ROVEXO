import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "pre-audit",
    title: "Pre-Audit Simulator",
    description: "Simulate external audit outcomes using live platform data.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Pre-Audit Simulator");
}
