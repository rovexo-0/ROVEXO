import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "reports",
    title: "Compliance Reports",
    description: "Generate audit-ready compliance reports and exports.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Compliance Reports");
}
