import { enterpriseComplianceMetadata, renderEnterpriseCompliancePage } from "@/lib/enterprise-compliance-center-engine/page";

export default async function EnterpriseCompliancePage() {
  return renderEnterpriseCompliancePage({
    tab: "integrity",
    title: "Integrity Verification",
    description: "Verify audit records, evidence, and timeline integrity.",
  });
}

export async function generateMetadata() {
  return enterpriseComplianceMetadata("Integrity Verification");
}
