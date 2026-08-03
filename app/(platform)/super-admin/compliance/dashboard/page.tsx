import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "dashboard",
    title: "Compliance Dashboard",
    description: "Unified compliance dashboard with audit, certification, and integrity scores.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Compliance Dashboard");
}
