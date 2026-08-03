import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "remediation",
    title: "Remediation Center",
    description: "Track priority remediation tasks and progress.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Remediation Center");
}
