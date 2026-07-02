import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "audit-timeline",
    title: "Audit Timeline",
    description: "Chronological record of administrative actions.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Audit Timeline");
}
