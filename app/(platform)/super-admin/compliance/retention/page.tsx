import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "retention",
    title: "Retention Policies",
    description: "Retention, archive, and export policy configuration.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Retention Policies");
}
