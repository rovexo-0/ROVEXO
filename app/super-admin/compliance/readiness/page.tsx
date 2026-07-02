import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "readiness",
    title: "Audit Readiness",
    description: "Overall audit readiness scores and trend analysis.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Audit Readiness");
}
